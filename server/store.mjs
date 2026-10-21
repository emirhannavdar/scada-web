import {reviseTextValues,reviseCollectionTexts} from './text-revision.mjs';
import { DEVICE_KEY, checkDevice, deviceContent } from "./device-content.mjs";
import { DESIGN_KEY, emptyDesign, validateDesign } from "../shared/design.mjs";
import { COLLECTION_KEY, makeCollections, validateCollections } from "./collections.mjs";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt),
  cost = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
export const digest = (s) => createHash("sha256").update(s).digest("hex");
export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 256)
    throw Error("Şifre 12–256 karakter olmalı.");
  const salt = randomBytes(24).toString("hex");
  return salt + ":" + (await derive(password, salt, 64, cost)).toString("hex");
}
export async function checkPassword(password, encoded) {
  const [salt, hash] = (encoded || "0".repeat(48) + ":" + "0".repeat(128)).split(":");
  const actual = await derive(password, salt, 64, cost);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
export class CmsError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function openStore(directory, catalogPath = new URL("./catalog.json", import.meta.url)) {
  const dir = resolve(directory);
  mkdirSync(join(dir, "uploads"), { recursive: true });
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8")),
    byId = new Map(catalog.fields.map((f) => [f.id, f])),
    assets = new Set(catalog.fields.filter((f) => f.kind === "image").map((f) => f.default.tr));
  const db = new DatabaseSync(join(dir, "cms.sqlite"));
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
  db.exec(`CREATE TABLE IF NOT EXISTS admin(id INTEGER PRIMARY KEY CHECK(id=1),email TEXT NOT NULL,password TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS content(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,draft TEXT NOT NULL,published TEXT NOT NULL,version INTEGER NOT NULL,updated TEXT NOT NULL);
 INSERT OR IGNORE INTO content VALUES(1,0,'{}','{}',0,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
 CREATE TABLE IF NOT EXISTS history(version INTEGER PRIMARY KEY,created TEXT NOT NULL,author TEXT NOT NULL,note TEXT NOT NULL,body TEXT NOT NULL);
 INSERT OR IGNORE INTO history VALUES(0,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'Sistem','Başlangıç içeriği','{}');
 CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until_at INTEGER NOT NULL);`);
  db.exec(`CREATE TABLE IF NOT EXISTS cms_users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('root','admin')),created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS cms_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,sender TEXT NOT NULL,recipient TEXT NOT NULL,body TEXT NOT NULL,created TEXT NOT NULL,read_at TEXT);
 CREATE INDEX IF NOT EXISTS cms_messages_recipient ON cms_messages(recipient,id);
 CREATE UNIQUE INDEX IF NOT EXISTS cms_users_single_root ON cms_users(role) WHERE role='root';`);
  db.exec(`CREATE TABLE IF NOT EXISTS approval_requests(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created TEXT NOT NULL,
    author TEXT NOT NULL,
    device TEXT NOT NULL CHECK(device IN ('desktop','mobile')),
    note TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending','approved','revision','rejected')),
    body TEXT NOT NULL,
    reviewer TEXT,
    reviewer_comment TEXT,
    reviewed TEXT
  );`);
  for (const column of [
    { name: "email", sql: "TEXT" },
    { name: "role", sql: "TEXT NOT NULL DEFAULT 'admin'" },
  ])
    if (
      !db
        .prepare("PRAGMA table_info(sessions)")
        .all()
        .some((c) => c.name === column.name)
    )
      db.exec(`ALTER TABLE sessions ADD COLUMN ${column.name} ${column.sql}`);
  db.exec("DELETE FROM sessions WHERE email IS NULL");
  const legacy = db.prepare("SELECT email,password FROM admin WHERE id=1").get();
  if (legacy && !db.prepare("SELECT id FROM cms_users WHERE role='root'").get())
    db.prepare(
      "INSERT OR IGNORE INTO cms_users(email,password,role,created) VALUES(?,?,'root',?)",
    ).run(legacy.email, legacy.password, new Date().toISOString());
  const imageAllowed = (value) =>
    typeof value === "string" &&
    (assets.has(value) ||
      (/^\/uploads\/[a-f0-9-]+\.(webp|png|jpg|avif)$/.test(value) &&
        Boolean(db.prepare("SELECT id FROM media WHERE id=?").get(value.split("/").at(-1)))));
  if (
    !db
      .prepare("PRAGMA table_info(media)")
      .all()
      .some((c) => c.name === "deleted")
  )
    db.exec("ALTER TABLE media ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0");
  function migrate(values) {
    const result = { ...values };
    for (const f of catalog.fields) {
      if (f.legacyId && Object.hasOwn(values, f.legacyId)) {
        if (!Object.hasOwn(result, f.id)) result[f.id] = values[f.legacyId];
        if (!byId.has(f.legacyId)) delete result[f.legacyId];
      }
    }
    return reviseTextValues(result);
  }
  function split(raw) {
    const values = migrate(raw);
    delete values[COLLECTION_KEY];
    delete values[DESIGN_KEY];
    delete values[DEVICE_KEY];
    return values;
  }
  function effective(raw) {
    return reviseCollectionTexts(raw[COLLECTION_KEY] ?? makeCollections(catalog, split(raw)));
  }
  function state(device) {
    device = checkDevice(device);
    const row = db.prepare("SELECT * FROM content WHERE id=1").get(),
      draft = deviceContent(JSON.parse(row.draft), device),
      published = deviceContent(JSON.parse(row.published), device);
    return {
      ...(device ? { device } : {}),
      revision: row.revision,
      version: row.version,
      updated: row.updated,
      values: split(draft),
      published: split(published),
      collections: effective(draft),
      publishedCollections: effective(published),
      design: draft[DESIGN_KEY] ?? emptyDesign(),
      publishedDesign: published[DESIGN_KEY] ?? emptyDesign(),
    };
  }

  function validate(values) {
    if (values && typeof values === "object" && !Array.isArray(values)) values = migrate(values);
    if (
      !values ||
      typeof values !== "object" ||
      Array.isArray(values) ||
      Object.keys(values).length > catalog.fields.length
    )
      throw new CmsError(400, "Geçersiz içerik.");
    const result = {};
    for (const [id, v] of Object.entries(values)) {
      const f = byId.get(id);
      if (!f || !v || typeof v !== "object" || Array.isArray(v))
        throw new CmsError(400, "Bilinmeyen içerik alanı.");
      if (f.kind === "boolean") {
        if (typeof v.tr !== "boolean") throw new CmsError(400, "Geçersiz seçenek.");
        result[id] = { tr: v.tr, en: v.tr };
        continue;
      }
      if (
        typeof v.tr !== "string" ||
        typeof v.en !== "string" ||
        v.tr.length > 12000 ||
        v.en.length > 12000
      )
        throw new CmsError(400, "Metin sınırı aşıldı.");
      if (!v.tr.trim() || (f.kind === "text" && !v.en.trim()))
        throw new CmsError(400, "Türkçe ve İngilizce metinleri boş bırakmayın.");
      if (
        f.kind === "image" &&
        !(
          assets.has(v.tr) ||
          (/^\/uploads\/[a-f0-9-]+\.(?:webp|png|jpg|avif)$/.test(v.tr) &&
            db.prepare("SELECT id FROM media WHERE id=?").get(v.tr.split("/").at(-1)))
        )
      )
        throw new CmsError(400, "Görsel kütüphanesinden bir görsel seçin.");
      if (f.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.tr))
        throw new CmsError(400, "Geçerli e-posta girin.");
      if (f.kind === "tel" && !/^tel:\+?[\d -]{7,25}$/.test(v.tr))
        throw new CmsError(400, "Telefon bağlantısı tel: ile başlamalı.");
      if (f.kind === "url" || f.kind === "map") {
        let url;
        try {
          url = new URL(v.tr);
        } catch {
          throw new CmsError(400, "Geçerli HTTPS bağlantısı girin.");
        }
        if (url.protocol !== "https:" || url.username || url.password)
          throw new CmsError(400, "HTTPS bağlantısı kullanın.");
        if (
          f.kind === "map" &&
          !(url.hostname === "www.google.com" && url.pathname === "/maps/embed")
        )
          throw new CmsError(400, "Google Haritalar yerleştirme bağlantısı kullanın.");
      }
      result[id] = { tr: v.tr, en: f.kind === "text" ? v.en : v.tr };
    }
    return result;
  }
  function transaction(callback) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const value = callback();
      db.exec("COMMIT");
      return value;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  function guard(revision) {
    if (!Number.isSafeInteger(revision) || state().revision !== revision)
      throw new CmsError(409, "İçerik başka bir oturumda değişti. Yenileyip tekrar deneyin.");
  }
  function save(revision, values, collections, design, device) {
    device = checkDevice(device);
    if (device) {
      const valid = validate(values),
        current = state(device),
        slot = {
          values: valid,
          collections: validateCollections(
            collections ?? current.collections,
            imageAllowed,
            catalog,
          ),
          design: validateDesign(design ?? current.design),
        };
      return transaction(() => {
        guard(revision);
        const old = JSON.parse(db.prepare("SELECT draft FROM content WHERE id=1").get().draft);
        old[DEVICE_KEY] = { ...old[DEVICE_KEY], [device]: slot };
        db.prepare("UPDATE content SET draft=?,revision=revision+1,updated=? WHERE id=1").run(
          JSON.stringify(old),
          new Date().toISOString(),
        );
        return state(device);
      });
    }
    const valid = validate(values),
      designData =
        design === undefined ? undefined : design === null ? emptyDesign() : validateDesign(design);
    let collectionData;
    if (collections !== undefined && collections !== null)
      collectionData = validateCollections(collections, imageAllowed, catalog);
    return transaction(() => {
      guard(revision);
      const old = JSON.parse(db.prepare("SELECT draft FROM content WHERE id=1").get().draft);
      if (old[DEVICE_KEY]) valid[DEVICE_KEY] = old[DEVICE_KEY];
      if (collections === undefined && old[COLLECTION_KEY])
        valid[COLLECTION_KEY] = old[COLLECTION_KEY];
      else if (collectionData) valid[COLLECTION_KEY] = collectionData;
      if (designData) valid[DESIGN_KEY] = designData;
      else if (old[DESIGN_KEY]) valid[DESIGN_KEY] = validateDesign(old[DESIGN_KEY]);
      db.prepare("UPDATE content SET draft=?,revision=revision+1,updated=? WHERE id=1").run(
        JSON.stringify(valid),
        new Date().toISOString(),
      );
      return state();
    });
  }
  function publish(revision, note, author, device) {
    device = checkDevice(device);
    if (device)
      return transaction(() => {
        guard(revision);
        const current = state(device),
          checked = {
            values: validate(current.values),
            collections: validateCollections(current.collections, imageAllowed, catalog),
            design: validateDesign(current.design),
          },
          published = JSON.parse(
            db.prepare("SELECT published FROM content WHERE id=1").get().published,
          );
        published[DEVICE_KEY] = { ...published[DEVICE_KEY], [device]: checked };
        const version = current.version + 1,
          now = new Date().toISOString(),
          body = JSON.stringify(published);
        db.prepare(
          "UPDATE content SET published=?,version=?,revision=revision+1,updated=? WHERE id=1",
        ).run(body, version, now);
        db.prepare("INSERT INTO history VALUES(?,?,?,?,?)").run(
          version,
          now,
          author,
          (device === "mobile" ? "Mobil: " : "Masaüstü: ") +
            String(note || "İçerik güncellemesi").slice(0, 180),
          body,
        );
        return state(device);
      });
    return transaction(() => {
      guard(revision);
      const current = state(),
        raw = JSON.parse(db.prepare("SELECT draft FROM content WHERE id=1").get().draft),
        checked = validate(current.values);
      if (raw[COLLECTION_KEY])
        checked[COLLECTION_KEY] = validateCollections(raw[COLLECTION_KEY], imageAllowed, catalog);
      if (raw[DEVICE_KEY]) {
        checked[DEVICE_KEY] =
          JSON.parse(db.prepare("SELECT published FROM content WHERE id=1").get().published)[
            DEVICE_KEY
          ] ?? {};
      }
      if (raw[DESIGN_KEY]) checked[DESIGN_KEY] = validateDesign(raw[DESIGN_KEY]);
      const body = JSON.stringify(checked),
        version = current.version + 1,
        now = new Date().toISOString();
      db.prepare(
        "UPDATE content SET published=?,version=?,revision=revision+1,updated=? WHERE id=1",
      ).run(body, version, now);
      db.prepare("INSERT INTO history VALUES(?,?,?,?,?)").run(
        version,
        now,
        author,
        String(note || "İçerik güncellemesi").slice(0, 200),
        body,
      );
      return state();
    });
  }
  function restore(revision, version, device) {
    device = checkDevice(device);
    const row = db.prepare("SELECT body FROM history WHERE version=?").get(version);
    if (!row) throw new CmsError(404, "Sürüm bulunamadı.");
    const raw = deviceContent(JSON.parse(row.body), device);
    if (device)
      return save(revision, split(raw), effective(raw), raw[DESIGN_KEY] ?? emptyDesign(), device);
    return save(revision, split(raw), raw[COLLECTION_KEY] ?? null, raw[DESIGN_KEY] ?? null);
  }
  function historyPayload(version, device) {
    device = checkDevice(device);
    const row = db.prepare("SELECT body FROM history WHERE version=?").get(version);
    if (!row) throw new CmsError(404, "Sürüm bulunamadı.");
    const raw = deviceContent(JSON.parse(row.body), device);
    return payload(
      split(raw),
      version,
      effective(raw),
      raw[DESIGN_KEY] ?? emptyDesign(),
      Boolean(device),
    );
  }
  function updateHistory(version, note) {
    if (!Number.isSafeInteger(version) || version < 0) throw new CmsError(400, "Geçersiz sürüm.");
    note = String(note || "")
      .trim()
      .slice(0, 200);
    if (!note) throw new CmsError(400, "Sürüm notu boş olamaz.");
    const result = db.prepare("UPDATE history SET note=? WHERE version=?").run(note, version);
    if (!result.changes) throw new CmsError(404, "Sürüm bulunamadı.");
  }
  function deleteHistory(version) {
    const current = state().version;
    if (!Number.isSafeInteger(version) || version <= 0)
      throw new CmsError(400, "Başlangıç sürümü silinemez.");
    if (version === current) throw new CmsError(400, "Yayındaki sürüm silinemez.");
    const result = db.prepare("DELETE FROM history WHERE version=?").run(version);
    if (!result.changes) throw new CmsError(404, "Sürüm bulunamadı.");
  }
  function createApproval(device, author, note) {
    device = checkDevice(device);
    if (!device) throw new CmsError(400, "Masaüstü veya mobil görünüm seçin.");
    const current = state(device),
      snapshot = {
        values: validate(current.values),
        collections: validateCollections(current.collections, imageAllowed, catalog),
        design: validateDesign(current.design),
      };
    const now = new Date().toISOString();
    const result = db
      .prepare(
        "INSERT INTO approval_requests(created,author,device,note,status,body) VALUES(?,?,?,?,\'pending\',?)",
      )
      .run(
        now,
        author,
        device,
        String(note || "İçerik güncellemesi").slice(0, 200),
        JSON.stringify(snapshot),
      );
    return db
      .prepare(
        "SELECT id,created,author,device,note,status,reviewer,reviewer_comment,reviewed FROM approval_requests WHERE id=?",
      )
      .get(result.lastInsertRowid);
  }
  function approvalPayload(id) {
    const row = db.prepare("SELECT * FROM approval_requests WHERE id=?").get(id);
    if (!row) throw new CmsError(404, "Onay talebi bulunamadı.");
    const snapshot = JSON.parse(row.body);
    return {...payload(
      snapshot.values,
      "approval-" + row.id,
      snapshot.collections,
      snapshot.design,
      true,
    ),device:row.device};
  }
  function reviewApproval(id, decision, comment, reviewer) {
    if (!["approved", "revision", "rejected"].includes(decision))
      throw new CmsError(400, "Geçersiz karar.");
    comment = String(comment || "")
      .trim()
      .slice(0, 500);
    if (decision === "revision" && !comment) throw new CmsError(400, "Revize notu yazın.");
    return transaction(() => {
      const row = db.prepare("SELECT * FROM approval_requests WHERE id=?").get(id);
      if (!row) throw new CmsError(404, "Onay talebi bulunamadı.");
      if (row.status !== "pending") throw new CmsError(409, "Bu talep daha önce sonuçlandırılmış.");
      const now = new Date().toISOString();
      if (decision === "approved") {
        const snapshot = JSON.parse(row.body),
          checked = {
            values: validate(snapshot.values),
            collections: validateCollections(snapshot.collections, imageAllowed, catalog),
            design: validateDesign(snapshot.design),
          },
          content = db.prepare("SELECT * FROM content WHERE id=1").get(),
          published = JSON.parse(content.published);
        published[DEVICE_KEY] = { ...(published[DEVICE_KEY] || {}), [row.device]: checked };
        const version = content.version + 1;
        db.prepare(
          "UPDATE content SET published=?,version=?,revision=revision+1,updated=? WHERE id=1",
        ).run(JSON.stringify(published), version, now);
        db.prepare("INSERT INTO history VALUES(?,?,?,?,?)").run(
          version,
          now,
          reviewer,
          (row.device === "mobile" ? "Mobil: " : "Masaüstü: ") + row.note,
          JSON.stringify(published),
        );
      }
      db.prepare(
        "UPDATE approval_requests SET status=?,reviewer=?,reviewer_comment=?,reviewed=? WHERE id=?",
      ).run(decision, reviewer, comment, now, id);
      return db
        .prepare(
          "SELECT id,created,author,device,note,status,reviewer,reviewer_comment,reviewed FROM approval_requests WHERE id=?",
        )
        .get(id);
    });
  }
  function payload(values, version, collections, design = emptyDesign(), full = false) {
    return {
      version,
      design,
      entries: Object.entries(
        migrate(
          full
            ? { ...Object.fromEntries(catalog.fields.map((f) => [f.id, f.default])), ...values }
            : values,
        ),
      )
        .filter(([id]) => byId.has(id))
        .map(([id, v]) => {
          const f = byId.get(id);
          return {
            id,
            target: f.target,
            kind: f.kind,
            ...(f.path ? { path: f.path } : {}),
            ...(f.source ? { source: f.source } : {}),
            ...v,
          };
        }),
      collections: reviseCollectionTexts(collections ?? makeCollections(catalog, values)),
    };
  }

  function session(req) {
    const token = /\bsw_admin=([a-f0-9]{64})\b/.exec(req.headers.cookie || "")?.[1];
    if (!token) return null;
    const row = db
      .prepare("SELECT * FROM sessions WHERE token=? AND expires>?")
      .get(digest(token), Date.now());
    return row ? { ...row, token } : null;
  }
  async function createAdmin(email, password, { replace = false } = {}) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error("Geçerli e-posta girin.");
    if (!replace && db.prepare("SELECT id FROM admin").get())
      throw Error("Yönetici zaten var. Şifre sıfırlama komutunu kullanın.");
    email = email.toLowerCase();
    const hash = await hashPassword(password);
    transaction(() => {
      db.prepare(
        "INSERT INTO admin VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,password=excluded.password",
      ).run(email, hash);
      const root = db.prepare("SELECT id FROM cms_users WHERE role='root'").get();
      if (root)
        db.prepare("UPDATE cms_users SET email=?,password=? WHERE id=?").run(email, hash, root.id);
      else
        db.prepare("INSERT INTO cms_users(email,password,role,created) VALUES(?,?,'root',?)").run(
          email,
          hash,
          new Date().toISOString(),
        );
      db.exec("DELETE FROM sessions; DELETE FROM attempts;");
    });
  }
  async function upsertUser(email, password, role = "admin") {
    email = String(email || "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new CmsError(400, "Geçerli e-posta girin.");
    if (!["root", "admin"].includes(role)) throw new CmsError(400, "Geçersiz yetki.");
    const existing = db.prepare("SELECT * FROM cms_users WHERE email=?").get(email);
    if (existing?.role === "root" && role !== "root")
      throw new CmsError(400, "Root kullanıcının yetkisi düşürülemez.");
    if (role === "root" && !existing)
      throw new CmsError(400, "Yeni root kullanıcısı oluşturulamaz.");
    const hash = password ? await hashPassword(password) : existing?.password;
    if (!hash) throw new CmsError(400, "Şifre gereklidir.");
    db.prepare(
      "INSERT INTO cms_users(email,password,role,created) VALUES(?,?,?,?) ON CONFLICT(email) DO UPDATE SET password=excluded.password,role=excluded.role",
    ).run(email, hash, role, existing?.created || new Date().toISOString());
    db.prepare("DELETE FROM sessions WHERE email=?").run(email);
    return db.prepare("SELECT id,email,role,created FROM cms_users WHERE email=?").get(email);
  }
  function deleteUser(id) {
    const user = db.prepare("SELECT * FROM cms_users WHERE id=?").get(id);
    if (!user) throw new CmsError(404, "Kullanıcı bulunamadı.");
    if (user.role === "root") throw new CmsError(400, "Root kullanıcı silinemez.");
    db.prepare("DELETE FROM cms_users WHERE id=?").run(id);
    db.prepare("DELETE FROM sessions WHERE email=?").run(user.email);
  }
  return {
    db,
    dir,
    catalog,
    state,
    validate,
    save,
    publish,
    restore,
    historyPayload,
    updateHistory,
    deleteHistory,
    createApproval,
    approvalPayload,
    reviewApproval,
    payload,
    session,
    createAdmin,
    upsertUser,
    deleteUser,
    close: () => db.close(),
  };
}
