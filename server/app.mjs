import { createGoogleReviewsService } from './google-reviews.mjs';
import { createMailService } from './mail.mjs';
import { renderPage, sitemap, siteOrigin, sendText, compression, robotsTxt } from './seo.mjs';
import { checkDevice } from "./device-content.mjs";
import http from "node:http";
import { originPolicy } from "./origin.mjs";
import { readFileSync, statSync, existsSync, createReadStream, writeFileSync, unlinkSync, } from "node:fs";
import { join, resolve, extname, sep } from "node:path";
import { randomBytes } from "node:crypto";
import { openStore, checkPassword, digest, CmsError } from "./store.mjs";
const mime = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json",
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".bin": "application/octet-stream",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
};
function fail(status, message) {
    throw new CmsError(status, message);
}
async function bytes(req, max) {
    if (Number(req.headers["content-length"] || 0) > max)
        fail(413, "Dosya veya istek çok büyük.");
    let size = 0;
    const chunks = [];
    for await (const b of req) {
        size += b.length;
        if (size > max)
            fail(413, "Dosya veya istek çok büyük.");
        chunks.push(b);
    }
    return Buffer.concat(chunks);
}
async function body(req) {
    if (!String(req.headers["content-type"]).startsWith("application/json"))
        fail(415, "JSON isteği gerekli.");
    try {
        return JSON.parse((await bytes(req, 2 * 1024 * 1024)).toString());
    }
    catch (e) {
        if (e instanceof CmsError)
            throw e;
        fail(400, "Geçersiz JSON.");
    }
}
function send(res, status, value) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(value));
}
function fileResponse(req, res, file, { immutable = false, privateFile = false } = {}) {
    let stat;
    try {
        stat = statSync(file);
    }
    catch {
        return false;
    }
    if (!stat.isFile())
        return false;
    res.setHeader("Content-Type", mime[extname(file).toLowerCase()] || "application/octet-stream");
    if (!req.headers.range && /\.(js|css)$/.test(file)) {
        res.setHeader('Vary', 'Accept-Encoding');
        const accepted = compression(req.headers['accept-encoding']);
        const suffix = accepted === 'br' ? '.br' : accepted === 'gzip' ? '.gz' : '';
        if (suffix && existsSync(file + suffix)) {
            file += suffix;
            stat = statSync(file);
            res.setHeader('Content-Encoding', suffix === '.br' ? 'br' : 'gzip');
        }
    }
    res.setHeader("Cache-Control", privateFile ? "no-store" : immutable ? "public, max-age=31536000, immutable" : "no-cache");
    let start = 0, end = stat.size - 1;
    if (req.headers.range) {
        const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!m || (!m[1] && !m[2])) {
            res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
            res.end();
            return true;
        }
        if (!m[1])
            start = Math.max(0, stat.size - Number(m[2]));
        else
            start = Number(m[1]);
        if (m[1] && m[2])
            end = Math.min(end, Number(m[2]));
        if (start > end || start >= stat.size) {
            res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
            res.end();
            return true;
        }
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
    }
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", Math.max(0, end - start + 1));
    if (req.method === "HEAD")
        res.end();
    else
        createReadStream(file, { start, end })
            .on("error", () => res.destroy())
            .pipe(res);
    return true;
}
function detectImage(b) {
    if (b.length >= 24 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        return { ext: "png", mime: "image/png", width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (b.length >= 12 && b.subarray(0, 3).equals(Buffer.from([255, 216, 255])))
        return { ext: "jpg", mime: "image/jpeg" };
    if (b.length >= 16 &&
        b.toString("ascii", 0, 4) === "RIFF" &&
        b.toString("ascii", 8, 12) === "WEBP")
        return { ext: "webp", mime: "image/webp" };
    if (b.length >= 24 &&
        b.toString("ascii", 4, 8) === "ftyp" &&
        ["avif", "avis"].includes(b.toString("ascii", 8, 12)))
        return { ext: "avif", mime: "image/avif" };
    return null;
}
export async function createCmsApp({ dataDir = process.env["CMS_DATA_DIR"] || "data", distDir = "dist", origin = process.env["CMS_ORIGIN"] || "", secureCookies = process.env["CMS_COOKIE_SECURE"] === "1", mailTransportFactory, googleReviewsFetch, } = {}) {
    const store = (await openStore(dataDir)), dist = resolve(distDir);
    let mail,googleReviews;
    try{mail=await createMailService(store,{transportFactory:mailTransportFactory});googleReviews=await createGoogleReviewsService(store,{fetcher:googleReviewsFetch})}catch(error){await store.close();throw error}
    let hashing = 0;
    const cookie = (token, age) => `sw_admin=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secureCookies ? "; Secure" : ""}`;
    function checkOrigin(req) {
        const policy = originPolicy(req, origin);
        if (!policy.accepted) {
            console.warn("[CMS adres kontrolü]", JSON.stringify(policy));
            fail(403, `İstek kaynağı doğrulanamadı. Paneli ${policy.expected}/admin adresinden açın. Farklı bir adres kullanıyorsanız CMS_ORIGIN ayarını güncelleyin.`);
        }
    }
    async function auth(req, mutation = false) {
        const session = (await store.session(req));
        if (!session)
            fail(401, "Oturum açmanız gerekiyor.");
        if (mutation) {
            checkOrigin(req);
            if (req.headers["x-csrf-token"] !== session.csrf)
                fail(403, "Oturum doğrulaması başarısız. Yeniden giriş yapın.");
        }
        return session;
    }
    async function root(req, mutation = false) {
        const session = (await auth(req, mutation));
        if (session.role !== "root")
            fail(403, "Bu bölüm yalnızca root kullanıcısına açıktır.");
        return session;
    }
    const server = http.createServer(async (req, res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        res.setHeader("X-Frame-Options", "DENY");
        let url;
        try {
            url = new URL(req.url, "http://localhost");
        }
        catch {
            send(res, 400, { error: "Geçersiz adres." });
            return;
        }
        const path = url.pathname, method = req.method;
        try {
        if (url.searchParams.get("cms-edit") === "1" &&
            url.searchParams.get("cms-preview") === "1" && (await store.session(req))) {
            res.setHeader("X-Frame-Options", "SAMEORIGIN");
            res.setHeader("Content-Security-Policy", "frame-ancestors 'self'; base-uri 'self'");
        }

            if (path.startsWith("/api/")) {
                res.setHeader("Cache-Control", "no-store");
                res.setHeader("X-Robots-Tag", "noindex, nofollow");
                if (path === '/api/contact' && method === 'POST') {
                    checkOrigin(req);
                    if (req.headers['x-scadawatt-request'] !== 'contact')
                        fail(400, 'Talep doğrulanamadı.');
                    (await mail.rate('contact:ingress:' + (req.socket.remoteAddress || 'unknown'), 60, 600000));
                    return send(res, 200, await mail.submit(await body(req), req.socket.remoteAddress || 'unknown'));
                }
                if (path === '/api/google-reviews' && method === 'GET') {
                    const language = url.searchParams.get('lang') === 'en' ? 'en' : 'tr';
                    const device = checkDevice(url.searchParams.get('device') || 'desktop');
                    if (req.headers['sec-fetch-site'] === 'cross-site')
                        fail(403, 'İstek doğrulanamadı.');
                    return send(res, 200, await googleReviews.publicReviews(device, language, req.socket.remoteAddress || 'unknown'));
                }
                if (path === '/api/cms/google-reviews' && method === 'GET') {
                    (await root(req));
                    return send(res, 200, (await googleReviews.read()));
                }
                if (path === '/api/cms/google-reviews' && method === 'PUT') {
                    (await root(req, true));
                    return send(res, 200, (await googleReviews.save(await body(req))));
                }
                if (path === '/api/cms/google-reviews/test' && method === 'POST') {
                    (await root(req, true));
                    (await googleReviews.rate('google:test', 5, 600000));
                    return send(res, 200, await googleReviews.load('tr'));
                }
                if (path === '/api/cms/mail-settings' && method === 'GET') {
                    (await root(req));
                    return send(res, 200, (await mail.read()));
                }
                if (path === '/api/cms/mail-settings' && method === 'PUT') {
                    (await root(req, true));
                    return send(res, 200, (await mail.save(await body(req))));
                }
                if (path === '/api/cms/mail-settings/verify' && method === 'POST') {
                    (await root(req, true));
                    (await mail.rate('mail:verify', 10, 600000));
                    return send(res, 200, await mail.verify());
                }
                if (path === '/api/cms/mail-settings/test' && method === 'POST') {
                    (await root(req, true));
                    (await mail.rate('mail:test', 5, 600000));
                    return send(res, 200, await mail.test());
                }
                if (path === "/api/content" && method === "GET") {
                    const s = (await store.state("desktop"));
                    res.setHeader("Cache-Control", "no-cache");
                    const variants = Object.fromEntries(await Promise.all(["desktop", "mobile"].map(async (device) => {
                        const v = (await store.state(device));
                        return [
                            device,
                            store.payload(v.published, v.version, v.publishedCollections, v.publishedDesign, true),
                        ];
                    })));
                    return send(res, 200, {
                        ...store.payload(s.published, s.version, s.publishedCollections, s.publishedDesign),
                        variants,
                    });
                }
                if (path === "/api/cms/session" && method === "GET") {
                    const s = (await store.session(req));
                    return send(res, 200, {
                        authenticated: Boolean(s),
                        setupRequired: !(await store.db.prepare("SELECT id FROM cms_users WHERE role='root'").get()),
                        ...(s ? { csrf: s.csrf, email: s.email, role: s.role } : {}),
                    });
                }
                if (path === "/api/cms/login" && method === "POST") {
                    checkOrigin(req);
                    const { email, password } = await body(req);
                    if (typeof email !== "string" ||
                        email.length > 254 ||
                        typeof password !== "string" ||
                        password.length > 256)
                        fail(400, "Geçersiz giriş bilgileri.");
                    const now = Date.now(), ip = req.socket.remoteAddress || "unknown";
                    (await store.db.prepare("DELETE FROM attempts WHERE until_at<?").run(now));
                    (await store.db.prepare("DELETE FROM sessions WHERE expires<?").run(now));
                    const key = "login:" + ip, attempt = (await store.db.prepare("SELECT * FROM attempts WHERE key=?").get(key)), global = (await store.db.prepare("SELECT * FROM attempts WHERE key=?").get("login:all"));
                    if ((attempt?.count || 0) >= 8 || (global?.count || 0) >= 40) {
                        res.setHeader("Retry-After", "900");
                        fail(429, "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.");
                    }
                    if (hashing >= 2)
                        fail(429, "Giriş işlemi sürüyor. Biraz sonra tekrar deneyin.");
                    for (const k of [key, "login:all"])
                        (await store.db
                            .prepare("INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1")
                            .run(k, now + 900000));
                    const admin = (await store.db
                        .prepare("SELECT * FROM cms_users WHERE email=?")
                        .get(email.trim().toLowerCase()));
                    hashing++;
                    let valid = false;
                    try {
                        valid = await checkPassword(password, admin?.password);
                    }
                    finally {
                        hashing--;
                    }
                    if (!admin || !valid)
                        fail(401, "E-posta veya şifre hatalı.");
                    (await store.db.prepare("DELETE FROM attempts WHERE key=?").run(key));
                    const token = randomBytes(32).toString("hex"), csrf = randomBytes(32).toString("hex");
                    (await store.db
                        .prepare("INSERT INTO sessions(token,csrf,expires,email,role) VALUES(?,?,?,?,?)")
                        .run(digest(token), csrf, Date.now() + 8 * 3600000, admin.email, admin.role));
                    res.setHeader("Set-Cookie", cookie(token, 8 * 3600));
                    return send(res, 200, {
                        authenticated: true,
                        csrf,
                        email: admin.email,
                        role: admin.role,
                    });
                }
                if (path === "/api/cms/logout" && method === "POST") {
                    const s = (await auth(req, true));
                    (await store.db.prepare("DELETE FROM sessions WHERE token=?").run(digest(s.token)));
                    res.setHeader("Set-Cookie", cookie("", 0));
                    return send(res, 200, { ok: true });
                }
                if (path === "/api/cms/messages" && method === "GET") {
                    const s = (await auth(req));
                    return send(res, 200, { items: s.role === 'root'
                            ? (await store.db.prepare('SELECT * FROM cms_messages ORDER BY id DESC LIMIT 300').all()) : (await store.db.prepare('SELECT * FROM cms_messages WHERE recipient=? ORDER BY id DESC LIMIT 200').all(s.email)) });
                }
                if (path === "/api/cms/messages" && method === "POST") {
                    const s = (await root(req, true)), b = await body(req), message = typeof b.message === 'string' ? b.message.trim() : '';
                    if (!message || message.length > 4000)
                        fail(400, 'Mesaj 1–4000 karakter olmalı.');
                    if (b.recipients !== 'all' && (!Array.isArray(b.recipients) || !b.recipients.length || b.recipients.length > 500 || b.recipients.some(id => !Number.isSafeInteger(id))))
                        fail(400, 'En az bir admin seçin.');
                    const admins = (await store.db.prepare("SELECT id,email FROM cms_users WHERE role='admin'").all());
                    const recipients = b.recipients === 'all' ? admins : admins.filter(user => b.recipients.includes(user.id));
                    if (!recipients.length || (b.recipients !== 'all' && new Set(b.recipients).size !== recipients.length))
                        fail(400, 'Seçilen admin bulunamadı.');
                    await store.db.transaction(async () => {
                        const insert = store.db.prepare('INSERT INTO cms_messages(sender,recipient,body,created) VALUES(?,?,?,?)'), created = new Date().toISOString();
                        for (const user of recipients)
                            await insert.run(s.email, user.email, message, created);
                    });
                    return send(res, 201, { sent: recipients.length });
                }
                if (/^\/api\/cms\/messages\/\d+\/read$/.test(path) && method === 'PATCH') {
                    const s = (await auth(req, true)), id = Number(path.split('/')[4]);
                    const result = (await store.db.prepare('UPDATE cms_messages SET read_at=COALESCE(read_at,?) WHERE id=? AND recipient=?').run(new Date().toISOString(), id, s.email));
                    if (!result.changes)
                        fail(404, 'Bildirim bulunamadı.');
                    return send(res, 200, { ok: true });
                }
                if (path === "/api/cms/workspace" && method === "GET") {
                    (await auth(req));
                    return send(res, 200, {
                        ...(await store.state(checkDevice(url.searchParams.get("device")))),
                        catalog: store.catalog,
                    });
                }
                if (path === "/api/cms/preview" && method === "GET") {
                    (await auth(req));
                    const reviewPayload = async (p, requestedDevice) => {
                        const device = p.device || requestedDevice || "desktop", baseline = (await store.state(device));
                        return { ...p, review: { ...baseline, device, values: Object.fromEntries(p.entries.map(e => [e.id, { tr: e.tr, en: e.en }])), collections: p.collections, design: p.design, catalog: store.catalog } };
                    };
                    const device = checkDevice(url.searchParams.get("device")), version = url.searchParams.get("version"), approval = url.searchParams.get("approval");
                    if (approval !== null) {
                        (await root(req));
                        const parsed = Number(approval);
                        if (!Number.isSafeInteger(parsed))
                            fail(400, "Geçersiz onay talebi.");
                        return send(res, 200, (await reviewPayload((await store.approvalPayload(parsed)), device)));
                    }
                    if (version !== null) {
                        (await root(req));
                        const parsed = Number(version);
                        if (!Number.isSafeInteger(parsed))
                            fail(400, "Geçersiz sürüm.");
                        return send(res, 200, (await reviewPayload((await store.historyPayload(parsed, device)), device)));
                    }
                    const s = (await store.state(device));
                    return send(res, 200, (await reviewPayload(store.payload(s.values, "draft-" + s.revision, s.collections, s.design, Boolean(device)), device)));
                }
                if (path === "/api/cms/draft" && method === "PUT") {
                    (await auth(req, true));
                    const b = await body(req);
                    return send(res, 200, (await store.save(b.revision, b.values, b.collections, b.design, b.device)));
                }
                if (path === "/api/cms/publish" && method === "POST") {
                    const s = (await auth(req, true)), b = await body(req);
                    if (s.role !== "root")
                        fail(403, "Admin doğrudan yayınlayamaz. Root onayına gönderin.");
                    return send(res, 200, (await store.publish(b.revision, b.note, s.email, b.device)));
                }
                if (path === "/api/cms/approvals" && method === "POST") {
                    const s = (await auth(req, true)), b = await body(req);
                    if (s.role !== "admin")
                        fail(403, "Yalnız admin kullanıcılar onay talebi oluşturabilir.");
                    return send(res, 201, { request: (await store.createApproval(b.device, s.email, b.note)) });
                }
                if (path === "/api/cms/approvals" && method === "GET") {
                    const s = (await auth(req)), where = s.role === "root" ? "" : " WHERE author=?", params = s.role === "root" ? [] : [s.email];
                    return send(res, 200, {
                        items: (await store.db
                            .prepare("SELECT id,created,author,device,note,status,reviewer,reviewer_comment,reviewed FROM approval_requests" +
                            where +
                            " ORDER BY id DESC LIMIT 200")
                            .all(...params)),
                    });
                }
                if (/^\/api\/cms\/approvals\/\d+$/.test(path) && method === "PATCH") {
                    const s = (await root(req, true)), b = await body(req), id = Number(path.split("/").at(-1));
                    return send(res, 200, {
                        request: (await store.reviewApproval(id, b.decision, b.comment, s.email)),
                    });
                }
                if (path === "/api/cms/users" && method === "GET") {
                    (await root(req));
                    return send(res, 200, {
                        items: (await store.db
                            .prepare("SELECT id,email,role,created FROM cms_users ORDER BY role DESC,email")
                            .all()),
                    });
                }
                if (path === "/api/cms/users" && method === "POST") {
                    (await root(req, true));
                    const b = await body(req);
                    return send(res, 201, { user: await store.upsertUser(b.email, b.password, "admin") });
                }
                if (/^\/api\/cms\/users\/\d+$/.test(path) && method === "PATCH") {
                    (await root(req, true));
                    const current = (await store.db
                        .prepare("SELECT * FROM cms_users WHERE id=?")
                        .get(Number(path.split("/").at(-1))));
                    if (!current)
                        fail(404, "Kullanıcı bulunamadı.");
                    const b = await body(req);
                    return send(res, 200, {
                        user: await store.upsertUser(current.email, b.password || "", current.role),
                    });
                }
                if (/^\/api\/cms\/users\/\d+$/.test(path) && method === "DELETE") {
                    (await root(req, true));
                    (await store.deleteUser(Number(path.split("/").at(-1))));
                    return send(res, 200, { deleted: true });
                }
                if (path === "/api/cms/restore" && method === "POST") {
                    (await root(req, true));
                    const b = await body(req);
                    if (!Number.isSafeInteger(b.version))
                        fail(400, "Geçersiz sürüm.");
                    return send(res, 200, (await store.restore(b.revision, b.version, b.device)));
                }
                if (path === "/api/cms/history" && method === "GET") {
                    (await root(req));
                    return send(res, 200, {
                        items: (await store.db
                            .prepare("SELECT version,created,author,note FROM history ORDER BY version DESC LIMIT 100")
                            .all()),
                    });
                }
                if (/^\/api\/cms\/history\/\d+$/.test(path) && method === "PATCH") {
                    (await root(req, true));
                    const version = Number(path.split("/").at(-1)), b = await body(req);
                    (await store.updateHistory(version, b.note));
                    return send(res, 200, { updated: true });
                }
                if (/^\/api\/cms\/history\/\d+$/.test(path) && method === "DELETE") {
                    (await root(req, true));
                    (await store.deleteHistory(Number(path.split("/").at(-1))));
                    return send(res, 200, { deleted: true });
                }
                if (path === "/api/cms/media" && method === "GET") {
                    (await auth(req));
                    return send(res, 200, {
                        items: (await store.db
                            .prepare("SELECT * FROM media WHERE deleted=0 ORDER BY created DESC")
                            .all()).map((m) => ({ ...m, url: "/uploads/" + m.id })),
                    });
                }
                if (path.startsWith("/api/cms/media/") && method === "DELETE") {
                    (await root(req, true));
                    const id = path.split("/").at(-1);
                    if (!/^[a-f0-9]{32}\.(png|jpg|webp|avif)$/.test(id))
                        fail(400, "Geçersiz görsel.");
                    const retained = await store.db.transaction(async()=>{
                    const row = (await store.db.prepare("SELECT * FROM media WHERE id=? AND deleted=0").get(id));
                    if (!row)
                        fail(404, "Görsel bulunamadı.");
                    const url = "/uploads/" + id, content = (await store.db.prepare("SELECT draft,published FROM content WHERE id=1").get()), retained = content.draft.includes(url) ||
                        content.published.includes(url) ||
                        Boolean((await store.db
                            .prepare("SELECT version FROM history WHERE instr(body,?)>0 LIMIT 1")
                            .get(url)));
                    if (retained)
                        (await store.db.prepare("UPDATE media SET deleted=1 WHERE id=?").run(id));
                    else {
                        (await store.db.prepare("DELETE FROM media WHERE id=?").run(id));
                    }
                    return retained;
                    });
                    if(!retained){const file=join(store.dir,"uploads",id);try{if(existsSync(file))unlinkSync(file)}catch{console.warn("Silinen görsel dosyası diskten kaldırılamadı.")}}
                    return send(res, 200, { removed: true, retained });
                }
                if (path === "/api/cms/media" && method === "POST") {
                    (await auth(req, true));
                    const size = (await store.db
                        .prepare("SELECT COALESCE(sum(size),0) AS bytes FROM media")
                        .get()).bytes;
                    if (size >= 512 * 1024 * 1024)
                        fail(413, "Görsel depolama sınırı doldu.");
                    const b = await bytes(req, 8 * 1024 * 1024), image = detectImage(b);
                    if (!image ||
                        !b.length ||
                        (image.width &&
                            (image.width > 8192 || image.height > 8192 || image.width * image.height > 32000000)))
                        fail(415, "PNG, JPEG, WebP veya AVIF görseli yükleyin. En fazla 8 MB / 32 megapiksel.");
                    let name;
                    try {
                        name = decodeURIComponent(String(req.headers["x-file-name"] || "Görsel"));
                    }
                    catch {
                        fail(400, "Geçersiz dosya adı.");
                    }
                    name = name.replace(/[\x00-\x1f/\\]/g, "").slice(0, 140);
                    const id = randomBytes(16).toString("hex") + "." + image.ext;
                    const file = join(store.dir, "uploads", id);
                    writeFileSync(file, b, { flag: "wx" });
                    try {
                        (await store.db
                            .prepare("INSERT INTO media(id,name,mime,size,created) VALUES(?,?,?,?,?)")
                            .run(id, name, image.mime, b.length, new Date().toISOString()));
                    }
                    catch (e) {
                        unlinkSync(file);
                        throw e;
                    }
                    return send(res, 201, {
                        id,
                        url: "/uploads/" + id,
                        name,
                        mime: image.mime,
                        size: b.length,
                    });
                }
                fail(404, "İşlem bulunamadı.");
            }
            if (method !== "GET" && method !== "HEAD")
                fail(405, "Yönteme izin verilmez.");
            if (path.startsWith("/uploads/")) {
                if (!/^\/uploads\/[a-f0-9]{32}\.(png|jpg|webp|avif)$/.test(path))
                    fail(404, "Görsel bulunamadı.");
                if (fileResponse(req, res, join(store.dir, "uploads", path.split("/").at(-1)), {
                    immutable: true,
                }))
                    return;
                fail(404, "Görsel bulunamadı.");
            }
            if (path === "/admin" || path.startsWith("/admin/") || url.searchParams.has("cms-preview"))
                res.setHeader("X-Robots-Tag", "noindex, nofollow");
            if (path === "/admin" || path.startsWith("/admin/"))
                res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
            if (path === '/robots.txt')
                return sendText(req, res, robotsTxt(req), 'text/plain; charset=utf-8');
            if (path === '/sitemap.xml')
                return sendText(req, res, (await sitemap(store)), 'application/xml; charset=utf-8');
            if ((path === '/gizlilik' || path === '/kvkk') && !url.searchParams.has('cms-preview')) {
                res.writeHead(301, { Location: '/privacy-policy' + url.search });
                return res.end();
            }
            if (path === '/demo') {
                res.writeHead(301, { Location: '/saha-yapilandirici' });
                return res.end();
            }
            if ((!extname(path) || path === '/index.html') && existsSync(join(dist, 'index.html'))) {
                const privatePage = path.startsWith('/admin') || url.searchParams.has('cms-preview') || url.searchParams.has('cms-edit');
                const rendered = (await renderPage(readFileSync(join(dist, 'index.html'), 'utf8'), path === '/index.html' ? '/' : path, store, privatePage, req));
                if (rendered.noindex)
                    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
                if (privatePage)
                    res.setHeader('Cache-Control', 'no-store');
                sendText(req, res, rendered.html, 'text/html; charset=utf-8', rendered.status);
                return;
            }
            const decoded = decodeURIComponent(path);
            if (decoded.includes("\0") || decoded.includes("\\"))
                fail(404, "Sayfa bulunamadı.");
            const file = resolve(dist, "." + decoded);
            if (!file.startsWith(dist + sep) && file !== dist)
                fail(404, "Sayfa bulunamadı.");
            if (fileResponse(req, res, file, {
                immutable: path.startsWith("/assets/"),
                privateFile: path.startsWith("/admin"),
            }))
                return;
            if (extname(path))
                fail(404, "Dosya bulunamadı.");
            if (fileResponse(req, res, join(dist, "index.html"), {
                privateFile: path.startsWith("/admin") || url.searchParams.has("cms-preview"),
            }))
                return;
            fail(503, "Önce npm.cmd run build komutunu çalıştırın.");
        }
        catch (error) {
            if (res.headersSent) {
                res.destroy();
                return;
            }
            send(res, error instanceof CmsError ? error.status : error.status === 400 ? 400 : 500, {
                error: error instanceof CmsError || error.status === 400
                    ? error.message
                    : "İşlem tamamlanamadı. Tekrar deneyin.",
            });
        }
    });
    server.headersTimeout = 15000;
    server.requestTimeout = 30000;
    server.keepAliveTimeout = 5000;
    return { server, store };
}
