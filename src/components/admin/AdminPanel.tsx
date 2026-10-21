import {GoogleReviewsSettings} from './GoogleReviewsSettings';
import {CommunityEditor} from './CommunityEditor';
import {MailSettings} from './MailSettings';
import {COMMUNITY_FIELD} from '../../../shared/community.mjs';
import {ConfiguratorEditor} from './ConfiguratorEditor';
import {CONFIGURATOR_FIELD} from '@/lib/configurator-engine';
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  FolderOpen as FolderImage,
  Globe,
  History,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Menu,
  Pencil,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import "./admin.css";
import "./admin-v69.css";
import { VisualEditor } from "./VisualEditor";
import { emptyDesign, type SiteDesign } from "@/lib/cms-design";
import { ChangeReview } from "./ChangeReview";
import {
  cmsChanges,
  revertCmsChange,
  revertAllCmsChanges,
  type CmsChange,
} from "@/lib/cms-changes";
import { CollectionsEditor } from "./CollectionsEditor";
import {
  type CmsCollections,
  type CollectionKind,
  managedRoots,
  collectionChangeCount,
} from "@/lib/cms-collections";
import { journeyStages, contentMatches, groupPage } from "@/lib/cms-editor";
type Value = { tr: string | boolean; en: string | boolean };
type Field = {
  id: string;
  target: string;
  path?: string[];
  source?: string;
  group: string;
  label: string;
  kind: string;
  retired?: boolean;
  location?: string;
  page?: string;
  keywords?: string;
  stage?: number;
  default: Value;
};
type Workspace = {
  device?: "desktop" | "mobile";
  revision: number;
  version: number;
  updated: string;
  values: Record<string, Value>;
  published: Record<string, Value>;
  collections?: CmsCollections;
  publishedCollections?: CmsCollections;
  design?: SiteDesign;
  publishedDesign?: SiteDesign;
  catalog: { fields: Field[]; comparisonLabels?: string[] };
};
type Session = {
  authenticated: boolean;
  setupRequired?: boolean;
  csrf?: string;
  email?: string;
  role?: "root" | "admin";
};
type Media = { id: string; url: string; name: string; size: number };
type Version = { version: number; created: string; author: string; note: string };
type CmsUser = { id: number; email: string; role: "root" | "admin"; created: string };
type Approval = {
  id: number;
  created: string;
  author: string;
  device: "desktop" | "mobile";
  note: string;
  status: "pending" | "approved" | "revision" | "rejected";
  reviewer?: string;
  reviewer_comment?: string;
  reviewed?: string;
};
const canonical = (v: Record<string, Value>) =>
  JSON.stringify(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)));
const same = (a: Value, b: Value) => a.tr === b.tr && a.en === b.en;
const when = (value: string) =>
  new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
async function request<T>(path: string, options: RequestInit = {}, csrf?: string) {
  const response = await fetch("/api/cms/" + path, {
    ...options,
    credentials: "same-origin",
    headers: {
      "X-ScadaWatt-Request": "cms",
      ...(options.body && typeof options.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok)
    throw Object.assign(Error(payload.error || "İşlem tamamlanamadı."), {
      status: response.status,
    });
  return payload as T;
}
function Busy() {
  return <LoaderCircle className="cms-spin" size={16} aria-label="İşlem sürüyor" />;
}
function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button,input")?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const all = ref.current?.querySelectorAll<HTMLElement>("button,input,select,a[href]");
        const first = all?.[0],
          last = all?.[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, []);
  return (
    <div className="cms-overlay">
      <div ref={ref} className="cms-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Pencereyi kapat">
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
function FieldEditor({
  field,
  value,
  published,
  onChange,
  onMedia,
}: {
  field: Field;
  value: Value;
  published: Value;
  onChange: (v: Value) => void;
  onMedia: () => void;
}) {
  const modified = !same(value, published),
    isText = field.kind === "text";
  return (
    <article className={`cms-field ${modified ? "is-modified" : ""}`}>
      <header>
        <div>
          <h3>{field.label}</h3>
          <small className="cms-field-location">{field.location || field.group}</small>
        </div>
        {modified && (
          <button onClick={() => onChange(published)} title="Yayındaki değere dön">
            <RotateCcw size={14} />
            <span>Geri al</span>
          </button>
        )}
      </header>
      {field.kind === "boolean" ? (
        <label className="cms-check">
          <input
            type="checkbox"
            checked={Boolean(value.tr)}
            onChange={(e) => onChange({ tr: e.target.checked, en: e.target.checked })}
          />
          Etkin
        </label>
      ) : field.kind === "image" ? (
        <div className="cms-image-field">
          <div>
            <img src={String(value.tr)} alt={field.label} loading="lazy" />
          </div>
          <section>
            <span>Görsel</span>
            <p>
              PNG, JPEG, WebP veya AVIF. En fazla 8 MB. Görselin çevresindeki sayfa düzeni korunur.
            </p>
            <button className="cms-secondary" onClick={onMedia}>
              <ImagePlus size={15} />
              Görseli değiştir
            </button>
            <code>{String(value.tr)}</code>
          </section>
        </div>
      ) : (
        <div className={`cms-language-fields ${isText ? "" : "single"}`}>
          <label>
            <span>{isText ? "Türkçe / TR" : "Değer"}</span>
            <textarea
              rows={String(value.tr).length > 150 ? 5 : 2}
              value={String(value.tr)}
              maxLength={12000}
              onChange={(e) =>
                onChange({ tr: e.target.value, en: isText ? value.en : e.target.value })
              }
            />
          </label>
          {isText && (
            <label>
              <span>English / EN</span>
              <textarea
                rows={String(value.en).length > 150 ? 5 : 2}
                value={String(value.en)}
                lang="en"
                maxLength={12000}
                onChange={(e) => onChange({ ...value, en: e.target.value })}
              />
            </label>
          )}
          {field.kind === "map" && (
            <p className="cms-help">
              Google Haritalar → Paylaş → Harita yerleştir içindeki src bağlantısını kullanın. HTML
              kodu yapıştırmayın.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
export function AdminPanel({
  initialMode = "visual",
}: { initialMode?: "visual" | "classic" } = {}) {
  const [visualRequested, setVisual] = useState(initialMode === "visual");
  const [visualMounted, setVisualMounted] = useState(initialMode === "visual");
  const [auth, setAuth] = useState<Session | null>(null),
    [loading, setLoading] = useState(true),
    [workspace, setWorkspace] = useState<Workspace | null>(null),
    [values, setValues] = useState<Record<string, Value>>({}),
    [group, setGroup] = useState("Animasyon metinleri"),
    [stage, setStage] = useState(0),
    [previewLanguage, setPreviewLanguage] = useState<"tr" | "en">("tr"),
    [kindFilter, setKindFilter] = useState("all"),
    [onlyChanges, setOnlyChanges] = useState(false),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [approvalSent, setApprovalSent] = useState(false),
    [view, setView] = useState<
      "content" | "media" | "history" | "collections" | "users" | "approvals" | "configurator" | "community" | "mail" | "google"
    >("content"),
    [media, setMedia] = useState<Media[]>([]),
    [versions, setVersions] = useState<Version[]>([]),
    [picker, setPicker] = useState<Field | null>(null),
    [confirmation, setConfirmation] = useState<"publish" | Version | null>(null),
    [note, setNote] = useState(""),
    [previewPath, setPreviewPath] = useState("/"),
    [sidebar, setSidebar] = useState(false);
  const [users, setUsers] = useState<CmsUser[]>([]),
    [approvals, setApprovals] = useState<Approval[]>([]),
    [newUserEmail, setNewUserEmail] = useState(""),
    [newUserPassword, setNewUserPassword] = useState("");
  const [collections, setCollections] = useState<CmsCollections | null>(null),
    [collectionKind, setCollectionKind] = useState<CollectionKind>("products"),
    [recordEditing, setRecordEditing] = useState(false),
    [deleteMedia, setDeleteMedia] = useState<Media | null>(null);
  const [design, setDesign] = useState<SiteDesign>(emptyDesign);
  const [reviewing, setReviewing] = useState(false);
  const collectionPick = useRef<((url: string) => void) | null>(null);
  const dirtyRef = useRef(false),
    operation = useRef(false),
    uploadRef = useRef<HTMLInputElement>(null),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const visual = auth?.role === "admin" || visualRequested;
  const device = workspace?.device ?? "desktop";
  const dirty = Boolean(
      workspace &&
      (canonical(values) !== canonical(workspace.values) ||
        JSON.stringify(collections) !== JSON.stringify(workspace.collections ?? null) ||
        JSON.stringify(design) !== JSON.stringify(workspace.design ?? emptyDesign())),
    ),
    unpublished = Boolean(
      workspace &&
      (canonical(values) !== canonical(workspace.published) ||
        JSON.stringify(collections) !== JSON.stringify(workspace.publishedCollections ?? null)),
    );
  dirtyRef.current = dirty || recordEditing;
  useEffect(() => {
    const fn = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!auth?.authenticated || auth.role !== "admin") return;
    void request<{ items: Approval[] }>("approvals")
      .then(({ items }) => setApprovalSent(items[0]?.status === "pending"))
      .catch(() => undefined);
  }, [auth?.authenticated, auth?.role]);
  function loaded(w: Workspace) {
    dirtyRef.current = false;
    setWorkspace(w);
    setDesign(w.design ?? emptyDesign());
    setValues(w.values);
    setCollections(w.collections ? structuredClone(w.collections) : null);
    setGroup((current) =>
      w.catalog.fields.some((f) => f.group === current)
        ? current
        : w.catalog.fields.some((f) => f.group === "Animasyon metinleri")
          ? "Animasyon metinleri"
          : w.catalog.fields[0]?.group || "Hakkımızda",
    );
  }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await request<Session>("session");
        if (!active) return;
        setAuth(s);
        if (s.authenticated) {
          const w = await request<Workspace>("workspace?device=desktop");
          if (active) loaded(w);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const fields = (workspace?.catalog.fields ?? []).filter(
      (f) => !f.retired && !["configurator","community"].includes(f.kind) && (!collections || !managedRoots.has(f.path?.[0] || "")),
    ),
    groups = useMemo(
      () =>
        [...new Set(fields.map((f) => f.group))].sort((a, b) =>
          a === "Animasyon metinleri"
            ? -1
            : b === "Animasyon metinleri"
              ? 1
              : a.localeCompare(b, "tr"),
        ),
      [fields],
    );
  const filtered = fields
    .filter(
      (f) =>
        (query
          ? contentMatches(f, values[f.id], query)
          : f.group === group && (group !== "Animasyon metinleri" || f.stage === stage)) &&
        (kindFilter === "all" ||
          (kindFilter === "image" ? f.kind === "image" : f.kind !== "image")) &&
        (!onlyChanges || !same(values[f.id] ?? f.default, workspace?.published[f.id] ?? f.default)),
    )
    .sort((a, b) =>
      a.group === "Animasyon metinleri" && b.group === "Animasyon metinleri"
        ? (a.stage ?? 0) -
          (b.stage ?? 0) +
          (a.stage === b.stage
            ? (["title", "body", "detail"].indexOf(a.path?.at(-1) || "") -
                ["title", "body", "detail"].indexOf(b.path?.at(-1) || "")) /
              10
            : 0)
        : 0,
    );
  function chooseGroup(next: string) {
    if (recordEditing && !confirm("Açık kayıt düzenlemesi iptal edilsin mi?")) return;
    const kinds: Record<string, CollectionKind> = {
      Ürünler: "products",
      "Teknik özellikler": "products",
      Çözümler: "solutions",
      Paketler: "plans",
      "Paket karşılaştırması": "plans",
    };
    if (collections && kinds[next]) {
      setCollectionKind(kinds[next]!);
      setPreviewPath(
        kinds[next] === "products"
          ? "/urunler"
          : kinds[next] === "solutions"
            ? "/cozumler"
            : "/paketler",
      );
      setView("collections");
      setSidebar(false);
      return;
    }
    setGroup(next);
    setView("content");
    setQuery("");
    setPage(0);
    setKindFilter("all");
    setOnlyChanges(false);
    setPreviewPath(groupPage(next));
    setSidebar(false);
  }
  const selectedStageFields = fields.filter(
      (f) => f.group === "Animasyon metinleri" && f.stage === stage,
    ),
    stageText = (key: string) => {
      const f = selectedStageFields.find((f) => f.path?.at(-1) === key);
      return f ? String((values[f.id] ?? f.default)[previewLanguage]) : "";
    };
  const shortcuts = [
    {
      name: "Animasyon / 3D yolculuk",
      group: "Animasyon metinleri",
      hint: "Saha, evirici, köşk, dünya, şehir ve monitör yazıları",
    },
    {
      name: "Ana sayfa",
      group: "Ana sayfa metinleri",
      hint: "Ana sayfanın bölüm başlıkları ve açıklamaları",
    },
    { name: "Ürünler", group: "Ürünler", hint: "Cihaz fotoğrafları, tanıtım ve ürün metinleri" },
    { name: "Hakkımızda", group: "Hakkımızda", hint: "Şirket anlatımı ve uygulama görseli" },
    { name: "İletişim", group: "İletişim", hint: "Adres, telefon, e-posta ve harita" },
    { name: "Paketler", group: "Paketler", hint: "Paket açıklamaları ve hizmet kapsamları" },
  ];

  const reviewWorkspace = workspace
    ? { ...workspace, values, design, ...(collections ? { collections } : {}) }
    : null;
  const diffs = useMemo(
    () => (reviewWorkspace ? cmsChanges(reviewWorkspace) : []),
    [workspace, values, collections, design],
  );
  function applyRevert(change?: CmsChange) {
    if (!reviewWorkspace) return;
    const next = change
      ? revertCmsChange(reviewWorkspace, change)
      : revertAllCmsChanges(reviewWorkspace);
    setValues(next.values);
    setDesign(next.design ?? emptyDesign());
    if (next.collections) setCollections(next.collections);
    setNotice("Değişiklik taslakta geri alındı. Kalıcı olması için taslağı kaydedin.");
  }
  const pages = Math.max(1, Math.ceil(filtered.length / 12)),
    visible = filtered.slice(page * 12, page * 12 + 12),
    changedCount = diffs.length;
  async function action(fn: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      const err = e as Error & { status?: number };
      setError(err.message);
      if (err.status === 401) {
        setAuth({ authenticated: false });
        setPassword("");
      }
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  async function loadMedia() {
    const r = await request<{ items: Media[] }>("media");
    setMedia(r.items);
  }
  async function loadUsers() {
    const r = await request<{ items: CmsUser[] }>("users");
    setUsers(r.items);
  }
  async function loadApprovals() {
    const r = await request<{ items: Approval[] }>("approvals");
    setApprovals(r.items);
  }
  async function decideApproval(item: Approval, decision: "approved" | "revision" | "rejected") {
    let comment = "";
    if (decision === "revision") {
      comment = prompt("Admin için revize notu")?.trim() || "";
      if (!comment) return;
    } else if (decision === "rejected") {
      comment = prompt("Reddetme açıklaması (isteğe bağlı)")?.trim() || "";
    } else if (!confirm("Bu değişiklikler doğrudan yayınlansın mı?")) return;
    await request(
      "approvals/" + item.id,
      { method: "PATCH", body: JSON.stringify({ decision, comment }) },
      auth?.csrf,
    );
    await loadApprovals();
    loaded(await request<Workspace>("workspace?device=" + item.device));
    setNotice(
      decision === "approved"
        ? "Talep onaylandı ve yayınlandı."
        : decision === "revision"
          ? "Revize isteği admine iletildi."
          : "Talep reddedildi.",
    );
  }
  async function save() {
    if (!workspace) throw Error("İçerik henüz yüklenmedi.");
    if (!dirty) return workspace;
    const result = await request<Omit<Workspace, "catalog">>(
      "draft",
      {
        method: "PUT",
        body: JSON.stringify({
          device,
          revision: workspace.revision,
          values,
          design,
          ...(collections ? { collections } : {}),
        }),
      },
      auth?.csrf,
    );
    const next = { ...result, catalog: workspace.catalog };
    loaded(next);
    return next;
  }
  function change(field: Field, value: Value) {
    setValues((current) => {
      const next = { ...current };
      if (same(value, field.default)) delete next[field.id];
      else next[field.id] = value;
      return next;
    });
    setNotice("");
  }
  async function login(event: React.FormEvent) {
    event.preventDefault();
    await action(async () => {
      const s = await request<Session>("login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(s);
      setPassword("");
      loaded(await request<Workspace>("workspace?device=desktop"));
    });
  }
  function selectImage(field: Field, url: string) {
    if (collectionPick.current) {
      collectionPick.current(url);
      collectionPick.current = null;
    } else change(field, { tr: url, en: url });
  }
  async function upload(file: File) {
    if (file.size > 8 * 1024 * 1024) throw Error("Görsel en fazla 8 MB olmalı.");
    const item = await request<Media>(
      "media",
      {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": "application/octet-stream",
          "X-File-Name": encodeURIComponent(file.name),
        },
      },
      auth?.csrf,
    );
    await loadMedia();
    if (picker) {
      selectImage(picker, item.url);
      setPicker(null);
    }
    setNotice("Görsel yüklendi. Sayfada görünmesi için taslağı kaydedip yayınlayın.");
  }
  if (loading)
    return (
      <div className="cms-app cms-loading">
        <Busy />
        <p>Yönetim paneli hazırlanıyor…</p>
      </div>
    );
  if (!auth?.authenticated)
    return (
      <main className="cms-app cms-login">
        <div className="cms-login-brand">
          <a href="/" aria-label="ScadaWatt ana sayfa">
            <img src="/assets/scadawatt-logo.png" alt="ScadaWatt" />
          </a>
          <span>İÇERİK YÖNETİMİ / 01</span>
        </div>
        <div className="cms-login-layout">
          <section>
            <p className="cms-eyebrow">KONTROL SİZDE.</p>
            <h1>
              Doğru içerik.
              <br />
              Doğru zamanda.
            </h1>
            <p>
              Metinleri ve görselleri düzenleyin. Önizleyin, yayınlayın ve gerektiğinde önceki
              sürümlere dönün.
            </p>
            <a href="/">
              <ArrowLeft size={16} />
              Web sitesine dön
            </a>
          </section>
          <form onSubmit={login}>
            <ShieldCheck size={28} />
            <h2>Yönetici girişi</h2>
            <p>İçerik yönetimine devam etmek için giriş yapın.</p>
            {auth?.setupRequired ? (
              <div className="cms-setup">
                <strong>İlk yönetici hesabı henüz oluşturulmadı.</strong>
                <p>
                  Proje klasöründe aşağıdaki komutu çalıştırın. E-posta ve şifrenizi terminalde siz
                  belirleyeceksiniz.
                </p>
                <code>npm.cmd run cms:setup</code>
              </div>
            ) : (
              <>
                <label>
                  E-posta
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  Şifre
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={256}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <button className="cms-primary" disabled={busy}>
                  {busy ? <Busy /> : <ArrowUpRight size={18} />}Giriş yap
                </button>
              </>
            )}

            {error && (
              <p className="cms-error" role="alert">
                {error}
              </p>
            )}
          </form>
        </div>
      </main>
    );
  const visualSurface =
    (visualMounted || auth.role === "admin") && workspace && auth.csrf ? (
      <div style={{ display: visual ? "block" : "none" }}>
        <VisualEditor
          initial={workspace}
          active={visual}
          csrf={auth.csrf}
          role={auth.role ?? "admin"}
          onClassic={(next) => {
            if (auth.role !== "root") return;
            loaded(next);
            setVisual(false);
          }}
          onUnauthorized={() => {
            setAuth({ authenticated: false });
            setPassword("");
          }}
        />
      </div>
    ) : null;
  return (
    <>
      {visualSurface}
      {auth.role === "root" && <div className="cms-app" style={{ display: visual ? "none" : undefined }}>
        <input
          ref={uploadRef}
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.currentTarget.value = "";
            if (file) void action(() => upload(file));
          }}
        />
        <aside className={`cms-sidebar ${sidebar ? "is-open" : ""}`}>
          <a href="/" className="cms-brand">
            <img src="/assets/scadawatt-logo.png" alt="ScadaWatt" />
            <span>İçerik yönetimi</span>
          </a>
          <button
            className="cms-secondary"
            onClick={() =>
              void action(async () => {
                if (recordEditing) throw Error("Önce açık kayıtta Listeye uygula düğmesine basın.");
                await save();
                setVisualMounted(true);
                setVisual(true);
              })
            }
          >
            <Eye size={17} />
            Sayfa üzerinde düzenle
          </button>
          <div className="cms-sidebar-label">ÇALIŞMA ALANI</div>
          <nav aria-label="Yönetim bölümleri"><button className={view==="google"?"is-active":""} onClick={()=>{if(recordEditing&&!confirm("Açık düzenleme iptal edilsin mi?"))return;setView("google");setSidebar(false)}}>Google yorum entegrasyonu</button><button className={view==="community"?"is-active":""} onClick={()=>{if(recordEditing&&!confirm("Açık düzenleme iptal edilsin mi?"))return;setView("community");setSidebar(false)}}>SSS ve müşteri yorumları</button><button className={view==="mail"?"is-active":""} onClick={()=>{if(recordEditing&&!confirm("Açık düzenleme iptal edilsin mi?"))return;setView("mail");setSidebar(false)}}>E-posta gönderimi</button><button className={view==="configurator"?"is-active":""} onClick={()=>{if(recordEditing&&!confirm("Açık düzenleme iptal edilsin mi?"))return;setView("configurator");setSidebar(false)}}>Saha yapılandırıcısı</button>
            <button
              className={view === "content" ? "is-active" : ""}
              onClick={() => {
                setView("content");
                setSidebar(false);
              }}
            >
              <FileText size={17} />
              İçerikler<span>{fields.length}</span>
            </button>
            {view === "content" && (
              <div className="cms-groups">
                {groups.map((g) => (
                  <button
                    key={g}
                    className={!query && g === group ? "is-active" : ""}
                    onClick={() => chooseGroup(g)}
                  >
                    {g}
                    <span>{fields.filter((f) => f.group === g).length}</span>
                  </button>
                ))}
              </div>
            )}
            {collections && (
              <button
                className={view === "collections" ? "is-active" : ""}
                onClick={() => {
                  if (recordEditing && !confirm("Açık kayıt düzenlemesi iptal edilsin mi?")) return;
                  setView("collections");
                  setSidebar(false);
                }}
              >
                <FileText size={17} />
                Donanım / çözüm / paket
              </button>
            )}
            <button
              className={view === "media" ? "is-active" : ""}
              onClick={() =>
                void action(async () => {
                  await loadMedia();
                  setView("media");
                  setSidebar(false);
                })
              }
            >
              <FolderImage size={17} />
              Görsel kütüphanesi
            </button>
            <button
              className={view === "history" ? "is-active" : ""}
              onClick={() =>
                void action(async () => {
                  const r = await request<{ items: Version[] }>("history");
                  setVersions(r.items);
                  setView("history");
                  setSidebar(false);
                })
              }
            >
              <History size={17} />
              Yayın geçmişi
            </button>
            {auth.role === "root" && (
              <button
                className={view === "approvals" ? "is-active" : ""}
                onClick={() =>
                  void action(async () => {
                    await loadApprovals();
                    setView("approvals");
                    setSidebar(false);
                  })
                }
              >
                <Check size={17} />
                Onay talepleri
                <span>{approvals.filter((item) => item.status === "pending").length || ""}</span>
              </button>
            )}
            {auth.role === "root" && (
              <button
                className={view === "users" ? "is-active" : ""}
                onClick={() =>
                  void action(async () => {
                    await loadUsers();
                    setView("users");
                    setSidebar(false);
                  })
                }
              >
                <ShieldCheck size={17} />
                Kullanıcılar ve yetkiler
              </button>
            )}
          </nav>
          <div className="cms-sidebar-bottom">
            <div>
              <ShieldCheck size={15} />
              <span>{auth.email}</span>
            </div>
            <button
              disabled={busy}
              onClick={() => {
                if (dirty && !confirm("Kaydedilmemiş değişiklikleriniz var. Çıkış yapılsın mı?"))
                  return;
                void action(async () => {
                  await request("logout", { method: "POST" }, auth.csrf);
                  setAuth({ authenticated: false });
                  setWorkspace(null);
                  setValues({});
                  setCollections(null);
                });
              }}
            >
              <LogOut size={16} />
              Çıkış yap
            </button>
          </div>
        </aside>
        <div className="cms-workspace">
          <header className="cms-topbar">
            <button
              className="cms-mobile-menu"
              aria-label="Bölümleri aç"
              onClick={() => setSidebar(!sidebar)}
            >
              <Menu size={21} />
            </button>
            <div>
              <span className="cms-status-dot" />
              <span>
                {dirty
                  ? "Kaydedilmemiş değişiklikler"
                  : diffs.length
                    ? "Taslakta değişiklik var"
                    : "Yayın ile aynı"}
              </span>
              <small>Yayın v{workspace?.version ?? 0}</small>
            </div>
            <a href="/" target="_blank" rel="noreferrer">
              Siteyi aç
              <ArrowUpRight size={15} />
            </a>
          </header>
          <main className="cms-main">

            <header className="cms-page-title">
              <div>
                <p className="cms-eyebrow">SCADAWATT / EDİTÖR</p>
                <h1>
                  {view==="google" ? "Google yorum entegrasyonu." : view === "community" ? "SSS ve müşteri yorumları." : view==="mail" ? "E-posta gönderimi." : view === "configurator" ? "Saha yapılandırıcısı." : view === "media"
                    ? "Görselleriniz."
                    : view === "history"
                      ? "Yayın geçmişi."
                      : view === "users"
                        ? "Kullanıcılar ve yetkiler."
                        : view === "approvals"
                          ? "Yayın onayları."
                          : view === "collections"
                            ? "Listelerinizi yönetin."
                            : "İçeriği siz yönetin."}
                </h1>
                <p>
                  {view==="google" ? "Google yorumlarını otomatik çekmek için API bağlantısını yönetin." : view==="community" ? "Soruları, gerçek müşteri yorumlarını ve Google bağlantısını yönetin." : view==="mail" ? "Form alıcısı ve güvenli SMTP bağlantısını yapılandırın." : view === "configurator" ? "Soruları, cevapları ve sonuç kurallarını taslak ve onay akışıyla yönetin." : view === "content"
                    ? "Önce sayfayı veya sahneyi seçin. Sonra ekranda gördüğünüz metni düzenleyin."
                    : view === "media"
                      ? "Bir kez yükleyin, içerik alanlarında kullanın."
                      : view === "users"
                        ? "Admin kullanıcıları ekleyin, şifrelerini yenileyin veya erişimlerini kaldırın."
                        : view === "approvals"
                          ? "Admin değişikliklerini önizleyin; yayınlayın, revize isteyin veya reddedin."
                          : view === "collections"
                            ? "Donanım, çözüm ve paket ekleyin; düzenleyin, sıralayın veya kaldırın."
                            : "Önceki bir yayını taslağa alın, inceleyip yeniden yayınlayın."}
                </p>
              </div>
              <span className="cms-count">
                {view === "content" ? String(changedCount).padStart(2, "0") : "—"}
                <small>{view === "content" ? "yayından farklı alan" : "içerik arşivi"}</small>
              </span>
            </header>
            {view==="configurator"&&workspace&&<ConfiguratorEditor value={String((values[CONFIGURATOR_FIELD]??workspace.catalog.fields.find(f=>f.id===CONFIGURATOR_FIELD)?.default)?.tr??"{}")} onApply={value=>setValues(old=>({...old,[CONFIGURATOR_FIELD]:{tr:value,en:value}}))} onEditingChange={setRecordEditing}/>}
            {view==="community"&&workspace&&auth.csrf&&<CommunityEditor csrf={auth.csrf} value={String((values[COMMUNITY_FIELD]??workspace.catalog.fields.find(f=>f.id===COMMUNITY_FIELD)?.default)?.tr??"{}")} onApply={value=>setValues(old=>({...old,[COMMUNITY_FIELD]:{tr:value,en:value}}))} onEditingChange={setRecordEditing}/>}
            {view==="google"&&auth.role==="root"&&auth.csrf&&<GoogleReviewsSettings csrf={auth.csrf} onEditingChange={setRecordEditing}/>}
            {view==="mail"&&auth.role==="root"&&auth.csrf&&<MailSettings csrf={auth.csrf} onEditingChange={setRecordEditing}/>}
            {error && (
              <div className="cms-alert cms-error" role="alert">
                {error}
                <button
                  onClick={() =>
                    void action(async () => {
                      if (
                        dirty &&
                        !confirm("Kaydedilmemiş değişiklikler silinecek. Sunucudan yenilensin mi?")
                      )
                        return;
                      loaded(await request<Workspace>("workspace?device=desktop"));
                    })
                  }
                >
                  Sunucudan yenile
                </button>
              </div>
            )}
            {notice && (
              <div className="cms-alert cms-success" role="status">
                <Check size={17} />
                {notice}
              </div>
            )}
            {view === "content" && (
              <>
                <section className="cms-shortcuts" aria-label="Nereyi düzenlemek istiyorsunuz?">
                  {shortcuts
                    .filter(
                      (item) =>
                        groups.includes(item.group) ||
                        (collections && ["Ürünler", "Paketler", "Çözümler"].includes(item.group)),
                    )
                    .map((item, i) => (
                      <button
                        key={item.group}
                        className={group === item.group && !query ? "is-active" : ""}
                        onClick={() => chooseGroup(item.group)}
                      >
                        <span>0{i + 1}</span>
                        <strong>{item.name}</strong>
                        <small>{item.hint}</small>
                      </button>
                    ))}
                </section>
                <div className="cms-toolbar">
                  <label className="cms-search">
                    <Search size={17} />
                    <input
                      aria-label="İçeriklerde ara"
                      placeholder="Sitede gördüğünüz metni yazın…"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(0);
                      }}
                    />
                    {query && (
                      <button
                        aria-label="Aramayı temizle"
                        onClick={() => {
                          setQuery("");
                          setPage(0);
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </label>
                  <span>
                    {query ? "Arama sonuçları" : group} · {filtered.length} alan
                  </span>
                </div>
                <div className="cms-filter-row">
                  <label>
                    Göster
                    <select
                      aria-label="İçerik türü"
                      value={kindFilter}
                      onChange={(e) => {
                        setKindFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <option value="all">Tüm alanlar</option>
                      <option value="text">Metin ve bilgiler</option>
                      <option value="image">Yalnız görseller</option>
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={onlyChanges}
                      onChange={(e) => {
                        setOnlyChanges(e.target.checked);
                        setPage(0);
                      }}
                    />
                    Yalnız yayından farklı alanlar
                  </label>
                </div>
                {!query && group === "Animasyon metinleri" && (
                  <section className="cms-journey-editor">
                    <header>
                      <div>
                        <p className="cms-eyebrow">ANA SAYFA / 3D YOLCULUK</p>
                        <h2>Hangi sahnenin yazısını değiştireceksiniz?</h2>
                        <p>
                          Bir sahne seçin. Başlık, açıklama ve “Bu aşamada ne oluyor?” metni aşağıda
                          birlikte açılır.
                        </p>
                      </div>
                    </header>
                    <div className="cms-stage-picker" role="group" aria-label="Animasyon sahneleri">
                      {journeyStages.map((name, i) => (
                        <button
                          key={name}
                          aria-pressed={stage === i}
                          onClick={() => {
                            setStage(i);
                            setPage(0);
                          }}
                        >
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          {name}
                        </button>
                      ))}
                    </div>
                    <section
                      className="cms-stage-preview"
                      aria-label="Seçilen sahnenin metin önizlemesi"
                    >
                      <div>
                        <span>
                          {String(stage + 1).padStart(2, "0")} / {journeyStages[stage]}
                        </span>
                        <div role="group" aria-label="Metin önizleme dili">
                          <button
                            aria-pressed={previewLanguage === "tr"}
                            onClick={() => setPreviewLanguage("tr")}
                          >
                            TR
                          </button>
                          <button
                            aria-pressed={previewLanguage === "en"}
                            onClick={() => setPreviewLanguage("en")}
                          >
                            EN
                          </button>
                        </div>
                      </div>
                      <h3>{stageText("title")}</h3>
                      <p>{stageText("body")}</p>
                      <small>
                        Bu alan yalnız metin yerleşimini gösterir. 3D sahne ve kamera hareketleri
                        değişmez.
                      </small>
                    </section>
                    <p className="cms-help">
                      Başlık: sahnenin büyük yazısı · Açıklama: altındaki paragraf · Ek bilgi:
                      ziyaretçinin düğmeye basınca açtığı metin.
                    </p>
                    {groups.includes("Animasyon ortak etiketleri") && (
                      <button
                        className="cms-journey-general"
                        onClick={() => chooseGroup("Animasyon ortak etiketleri")}
                      >
                        Yolculuğun ortak buton ve etiketlerini düzenle <ArrowUpRight size={14} />
                      </button>
                    )}
                  </section>
                )}
                <fieldset disabled={busy} className="cms-editor">
                  {visible.map((field) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      value={values[field.id] ?? field.default}
                      published={workspace?.published[field.id] ?? field.default}
                      onChange={(value) => change(field, value)}
                      onMedia={() =>
                        void action(async () => {
                          collectionPick.current = null;
                          await loadMedia();
                          setPicker(field);
                        })
                      }
                    />
                  ))}
                  {!visible.length && (
                    <p className="cms-empty">Bu seçim ve filtrelerle eşleşen içerik bulunamadı.</p>
                  )}
                </fieldset>
                <div className="cms-pagination">
                  <span>
                    {page + 1} / {pages}
                  </span>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    aria-label="Önceki alanlar"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    disabled={page >= pages - 1}
                    onClick={() => setPage(page + 1)}
                    aria-label="Sonraki alanlar"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </>
            )}
            {view === "collections" && collections && (
              <CollectionsEditor
                collections={collections}
                onChange={setCollections}
                kind={collectionKind}
                onKind={(kind) => {
                  setCollectionKind(kind);
                  setPreviewPath(
                    kind === "products"
                      ? "/urunler"
                      : kind === "solutions"
                        ? "/cozumler"
                        : "/paketler",
                  );
                }}
                comparisonLabels={workspace?.catalog.comparisonLabels ?? []}
                onEditingChange={setRecordEditing}
                onImage={(url, callback) =>
                  void action(async () => {
                    await loadMedia();
                    collectionPick.current = callback;
                    setPicker({
                      id: "collection-image",
                      target: "asset",
                      group: "Görseller",
                      label: "Kayıt görseli",
                      kind: "image",
                      default: { tr: url, en: url },
                    });
                  })
                }
              />
            )}
            {view === "media" && (
              <>
                <div className="cms-media-intro">
                  <p>
                    PNG, JPEG, WebP, AVIF · en fazla 8 MB / dosya. Hızlı açılış için görselleri
                    uygun boyutta, tercihen WebP olarak yükleyin. Animasyonun 3D modelleri bu
                    kütüphaneden değiştirilmez.
                  </p>
                  <button
                    className="cms-primary"
                    disabled={busy}
                    onClick={() => uploadRef.current?.click()}
                  >
                    <Upload size={16} />
                    Görsel yükle
                  </button>
                </div>
                <div className="cms-media-grid">
                  {media.map((m) => (
                    <article key={m.id}>
                      <img src={m.url} alt={m.name} loading="lazy" />
                      <h3>{m.name}</h3>
                      <p>{(m.size / 1024).toFixed(0)} KB · Yüklenen görsel</p>
                      <button
                        type="button"
                        className="cms-media-delete"
                        onClick={() => setDeleteMedia(m)}
                      >
                        <X size={14} />
                        Görseli sil
                      </button>
                    </article>
                  ))}
                </div>
                {!media.length && (
                  <div className="cms-empty">
                    <FolderImage size={32} />
                    <h2>İlk görselinizi yükleyin.</h2>
                    <p>
                      Mevcut site görselleri içerik alanlarında korunur. Yeni yüklemeleriniz burada
                      listelenir.
                    </p>
                  </div>
                )}
              </>
            )}
            {view === "approvals" && auth.role === "root" && (
              <section className="cms-history cms-approvals">
                {approvals.map((item) => (
                  <article key={item.id}>
                    <div className="cms-version-icon">
                      <Check size={19} />
                    </div>
                    <div>
                      <h3>
                        Talep #{item.id} · {item.device === "mobile" ? "Mobil" : "Masaüstü"}
                      </h3>
                      <p>{item.note || "İçerik güncellemesi"}</p>
                      <small>
                        {when(item.created)} · {item.author}
                      </small>
                      {item.reviewer_comment && (
                        <small>
                          <strong>Root notu:</strong> {item.reviewer_comment}
                        </small>
                      )}
                    </div>
                    <span className={`cms-approval-status is-${item.status}`}>
                      {item.status === "pending"
                        ? "Onay bekliyor"
                        : item.status === "approved"
                          ? "Yayınlandı"
                          : item.status === "revision"
                            ? "Revize istendi"
                            : "Reddedildi"}
                    </span>
                    <div className="cms-history-actions">
                      <button
                        className="cms-secondary"
                        onClick={() =>
                          window.open(
                            "/?cms-preview=1&cms-device=" +
                              item.device +
                              "&cms-approval=" +
                              item.id,
                            "_blank",
                            "noopener",
                          )
                        }
                      >
                        <Eye size={14} />
                        Önizle
                      </button>
                      {item.status === "pending" && (
                        <>
                          <button
                            className="cms-primary"
                            disabled={busy}
                            onClick={() => void action(() => decideApproval(item, "approved"))}
                          >
                            <Globe size={14} />
                            Onayla ve yayınla
                          </button>
                          <button
                            className="cms-secondary"
                            disabled={busy}
                            onClick={() => void action(() => decideApproval(item, "revision"))}
                          >
                            <Pencil size={14} />
                            Revize iste
                          </button>
                          <button
                            className="cms-secondary cms-history-delete"
                            disabled={busy}
                            onClick={() => void action(() => decideApproval(item, "rejected"))}
                          >
                            <X size={14} />
                            Reddet
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
                {!approvals.length && (
                  <div className="cms-empty">
                    <Check size={32} />
                    <h2>Henüz onay talebi yok.</h2>
                  </div>
                )}
              </section>
            )}
            {view === "users" && auth.role === "root" && (
              <section className="cms-users">
                <form
                  className="cms-user-create"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void action(async () => {
                      await request(
                        "users",
                        {
                          method: "POST",
                          body: JSON.stringify({ email: newUserEmail, password: newUserPassword }),
                        },
                        auth.csrf,
                      );
                      setNewUserEmail("");
                      setNewUserPassword("");
                      await loadUsers();
                      setNotice("Admin kullanıcısı oluşturuldu.");
                    });
                  }}
                >
                  <h2>Yeni admin ekle</h2>
                  <p>
                    Admin yalnızca görsel editörde sayfa içeriğini güncelleyebilir. Yönetim bölümünü
                    göremez.
                  </p>
                  <label>
                    E-posta
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </label>
                  <label>
                    Geçici şifre
                    <input
                      type="password"
                      required
                      minLength={12}
                      maxLength={256}
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                  </label>
                  <button className="cms-primary" disabled={busy}>
                    <UserPlus size={16} />
                    Admin oluştur
                  </button>
                </form>
                <div className="cms-user-list">
                  {users.map((user) => (
                    <article key={user.id}>
                      <div>
                        <strong>{user.email}</strong>
                        <small>
                          {user.role === "root"
                            ? "ROOT · Tam yetki"
                            : "ADMIN · Yalnız sayfa düzenleme"}
                        </small>
                      </div>
                      {user.role === "admin" && (
                        <div className="cms-history-actions">
                          <button
                            className="cms-secondary"
                            disabled={busy}
                            onClick={() => {
                              const password = prompt("Yeni şifre (en az 12 karakter)");
                              if (password)
                                void action(async () => {
                                  await request(
                                    "users/" + user.id,
                                    { method: "PATCH", body: JSON.stringify({ password }) },
                                    auth.csrf,
                                  );
                                  setNotice("Kullanıcı şifresi güncellendi.");
                                });
                            }}
                          >
                            <Pencil size={14} />
                            Şifreyi değiştir
                          </button>
                          <button
                            className="cms-secondary cms-history-delete"
                            disabled={busy}
                            onClick={() => {
                              if (confirm(user.email + " kullanıcısının erişimi kaldırılsın mı?"))
                                void action(async () => {
                                  await request(
                                    "users/" + user.id,
                                    { method: "DELETE" },
                                    auth.csrf,
                                  );
                                  await loadUsers();
                                  setNotice("Admin kullanıcısı kaldırıldı.");
                                });
                            }}
                          >
                            <Trash2 size={14} />
                            Kaldır
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
            {view === "history" && (
              <div className="cms-history">
                {versions.map((v) => (
                  <article key={v.version}>
                    <div className="cms-version-icon">
                      <History size={19} />
                    </div>
                    <div>
                      <h3>
                        {v.version === workspace?.version ? "Yayında · " : ""}Sürüm {v.version}
                      </h3>
                      <p>{v.note}</p>
                      <small>
                        {when(v.created)} · {v.author}
                      </small>
                    </div>
                    <div className="cms-history-actions">
                      <button
                        disabled={busy}
                        className="cms-secondary"
                        onClick={() =>
                          window.open(
                            previewPath +
                              "?cms-preview=1&cms-device=" +
                              device +
                              "&cms-version=" +
                              v.version,
                            "_blank",
                            "noopener",
                          )
                        }
                      >
                        <Eye size={14} />
                        Önizle
                      </button>
                      <button
                        disabled={busy}
                        className="cms-secondary"
                        onClick={() => setConfirmation(v)}
                      >
                        <RotateCcw size={14} />
                        Taslağa al
                      </button>
                      <button
                        disabled={busy}
                        className="cms-secondary"
                        onClick={() =>
                          void action(async () => {
                            if (!workspace) return;
                            const restored = await request<Omit<Workspace, "catalog">>(
                              "restore",
                              {
                                method: "POST",
                                body: JSON.stringify({
                                  device,
                                  revision: workspace.revision,
                                  version: v.version,
                                }),
                              },
                              auth.csrf,
                            );
                            const published = await request<Omit<Workspace, "catalog">>(
                              "publish",
                              {
                                method: "POST",
                                body: JSON.stringify({
                                  device,
                                  revision: restored.revision,
                                  note: "Sürüm " + v.version + " yeniden yayınlandı",
                                }),
                              },
                              auth.csrf,
                            );
                            loaded({ ...published, catalog: workspace.catalog });
                            const history = await request<{ items: Version[] }>("history");
                            setVersions(history.items);
                            setNotice("Sürüm " + v.version + " doğrudan yayına alındı.");
                          })
                        }
                      >
                        <Globe size={14} />
                        Yayınla
                      </button>
                      <button
                        disabled={busy}
                        className="cms-secondary"
                        onClick={() => {
                          const note = prompt("Sürüm notu", v.note);
                          if (note && note.trim() && note !== v.note)
                            void action(async () => {
                              await request(
                                "history/" + v.version,
                                { method: "PATCH", body: JSON.stringify({ note }) },
                                auth.csrf,
                              );
                              const history = await request<{ items: Version[] }>("history");
                              setVersions(history.items);
                              setNotice("Sürüm notu güncellendi.");
                            });
                        }}
                      >
                        <Pencil size={14} />
                        Notu düzenle
                      </button>
                      {v.version > 0 && v.version !== workspace?.version && (
                        <button
                          disabled={busy}
                          className="cms-secondary cms-history-delete"
                          onClick={() => {
                            if (confirm("Sürüm " + v.version + " kalıcı olarak silinsin mi?"))
                              void action(async () => {
                                await request(
                                  "history/" + v.version,
                                  { method: "DELETE" },
                                  auth.csrf,
                                );
                                const history = await request<{ items: Version[] }>("history");
                                setVersions(history.items);
                                setNotice("Sürüm silindi.");
                              });
                          }}
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="cms-workflow">
              <label>
                Görünüm
                <select
                  aria-label="Düzenlenen cihaz"
                  value={device}
                  disabled={busy || recordEditing}
                  onChange={(e) => {
                    const next = e.target.value;
                    void action(async () => {
                      if (dirty) await save();
                      loaded(await request<Workspace>("workspace?device=" + next));
                      setNotice(
                        (next === "mobile" ? "Mobil" : "Masaüstü") +
                          " görünüm açık. Yalnız bu görünüm değişir.",
                      );
                    });
                  }}
                >
                  <option value="desktop">Masaüstü</option>
                  <option value="mobile">Mobil</option>
                </select>
              </label>
              <div>
                <Clock size={15} />
                <span>{workspace ? "Son kayıt: " + when(workspace.updated) : "Hazırlanıyor"}</span>
              </div>
              <div>
                <button
                  disabled={busy || recordEditing || !dirty}
                  className="cms-secondary"
                  onClick={() =>
                    void action(async () => {
                      await save();
                      setNotice("Taslak kaydedildi. Ziyaretçilerin gördüğü içerik değişmedi.");
                    })
                  }
                >
                  {busy ? <Busy /> : <Save size={16} />}Taslağı kaydet
                </button>
                <label className="cms-preview-path">
                  <span className="sr-only">Önizlenecek sayfa</span>
                  <select value={previewPath} onChange={(e) => setPreviewPath(e.target.value)}>
                    <option value="/">Ana sayfa</option>
                    <option value="/hakkimizda">Hakkımızda</option><option value="/saha-yapilandirici">Saha yapılandırıcısı</option>
                    <option value="/iletisim">İletişim</option>
                    <option value="/paketler">Paketler</option>
                    <option value="/cozumler">Çözümler</option>
                    <option value="/urunler">Ürünler</option>
                    <option value="/scada-yazilimi">SCADA Yazılımı</option>
                  </select>
                </label>
                <button
                  disabled={busy || recordEditing}
                  className="cms-secondary"
                  onClick={() =>
                    void action(async () => {
                      await save();
                      window.location.assign(previewPath + "?cms-preview=1&cms-device=" + device);
                    })
                  }
                >
                  <Eye size={16} />
                  Önizle
                </button>
                <button
                  className="cms-secondary"
                  disabled={busy || recordEditing}
                  onClick={() => setReviewing(true)}
                >
                  <Eye size={16} />
                  Değişiklikleri gör ({diffs.length})
                </button>
                <button
                  className="cms-primary"
                  disabled={busy || recordEditing || !diffs.length || approvalSent}
                  onClick={() => setConfirmation("publish")}
                >
                  <Globe size={16} />
                  {auth.role === "root"
                    ? "Yayınla"
                    : approvalSent
                      ? "Root onayına gönderildi"
                      : "Onaya gönder"}
                </button>
              </div>
            </div>
            <p className="cms-footnote">
              {recordEditing && (
                <strong>Önce açık düzenlemeyi taslağa uygulayın. </strong>
              )}
              Taslak → Önizleme → Yayın. Yeni yayın, ziyaretçiler sayfayı yeniden açtığında görünür.
              Sabit sayfa düzeni, URL’ler ve 3D sahne yapısı korunur.
            </p>
          </main>
        </div>
        {picker && (
          <Dialog
            title="Görsel seçin"
            onClose={() => {
              collectionPick.current = null;
              setPicker(null);
            }}
          >
            <p className="cms-help">
              Seçiminiz taslağa eklenir; yayınlayana kadar ziyaretçiler görmez.
            </p>
            <button
              className="cms-primary"
              disabled={busy}
              onClick={() => uploadRef.current?.click()}
            >
              <Upload size={16} />
              Yeni görsel yükle
            </button>
            <div className="cms-picker-grid">
              {[
                ...(picker.default.tr
                  ? [
                      {
                        id: "original",
                        url: String(picker.default.tr),
                        name: "Bu alanın ilk görseli",
                        size: 0,
                      },
                    ]
                  : []),
                ...media,
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    selectImage(picker, m.url);
                    setPicker(null);
                  }}
                >
                  <img src={m.url} alt="" loading="lazy" />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </Dialog>
        )}
        {deleteMedia && (
          <Dialog title="Görseli kütüphaneden sil" onClose={() => setDeleteMedia(null)}>
            <p>
              “{deleteMedia.name}” görseli kütüphaneden kaldırılacak. Taslak, yayın veya geçmişte
              kullanılan dosya, sayfalar bozulmasın diye arşivde korunur. Kullanılmayan dosya
              diskten de silinir.
            </p>
            <footer>
              <button
                className="cms-secondary"
                disabled={busy}
                onClick={() => setDeleteMedia(null)}
              >
                Vazgeç
              </button>
              <button
                className="cms-primary"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    const result = await request<{ retained: boolean }>(
                      "media/" + deleteMedia.id,
                      { method: "DELETE" },
                      auth.csrf,
                    );
                    await loadMedia();
                    setDeleteMedia(null);
                    setNotice(
                      result.retained
                        ? "Görsel kütüphaneden kaldırıldı. Kullanıldığı yayın/geçmiş için dosya korundu."
                        : "Görsel ve kullanılmayan dosya silindi.",
                    );
                  })
                }
              >
                Görseli sil
              </button>
            </footer>
          </Dialog>
        )}
        {reviewing && reviewWorkspace && (
          <Dialog title="Değişiklikleri gör" onClose={() => setReviewing(false)}>
            <p className="cms-help">
              Yalnız {device === "mobile" ? "mobil" : "masaüstü"} görünümün değişiklikleri.
            </p>
            <ChangeReview
              workspace={reviewWorkspace}
              onRevert={(change) => applyRevert(change)}
              onRevertAll={() => applyRevert()}
              disabled={busy}
            />
            <p className="cms-review-cancel-help">
              Pencereyi kapatmak taslağı silmez. Geri almaları kalıcı tutmak için taslağı kaydedin.
            </p>
            <footer>
              <button className="cms-secondary" disabled={busy} onClick={() => setReviewing(false)}>
                İncelemeyi kapat
              </button>
              <button
                className="cms-secondary"
                disabled={busy || !dirty}
                onClick={() =>
                  void action(async () => {
                    await save();
                    setNotice("Taslak kaydedildi. Ziyaretçilerin gördüğü içerik değişmedi.");
                  })
                }
              >
                <Save size={16} />
                Taslağı kaydet
              </button>
              <button
                className="cms-primary"
                disabled={busy || !diffs.length || approvalSent}
                onClick={() => {
                  setReviewing(false);
                  setConfirmation("publish");
                }}
              >
                <Globe size={16} />
                {auth.role === "root" ? "Yayına geç" : "Onaya gönder"}
              </button>
            </footer>
          </Dialog>
        )}
        {confirmation && (
          <Dialog
            title={
              confirmation === "publish"
                ? auth.role === "root"
                  ? "İçeriği yayınla"
                  : "Root onayına gönder"
                : "Sürümü taslağa al"
            }
            onClose={() => setConfirmation(null)}
          >
            <p>
              {confirmation === "publish"
                ? auth.role === "root"
                  ? `${changedCount} değişiklik yayınlanacak. Ziyaretçiler yeni içeriği sayfayı yeniden açtığında görecek.`
                  : `${changedCount} değişiklik root incelemesine gönderilecek. Onaylanmadan yayınlanmayacak.`
                : `Sürüm ${confirmation.version} taslağa alınacak. Mevcut taslak değiştirilecek; yayındaki içerik siz yayınlayana kadar korunacak.`}
            </p>
            {confirmation === "publish" && reviewWorkspace && (
              <>
                <p className="cms-help">
                  Yalnız {device === "mobile" ? "mobil" : "masaüstü"} görünümün değişiklikleri.
                </p>
                <ChangeReview
                  workspace={reviewWorkspace}
                  onRevert={(change) => applyRevert(change)}
                  onRevertAll={() => applyRevert()}
                  disabled={busy}
                />
                <p className="cms-review-cancel-help">
                  Vazgeç pencereyi kapatır; taslağı silmez. Bir değişikliği iptal etmek için Geri al
                  kullanın.
                </p>
              </>
            )}
            {confirmation === "publish" && (
              <label className="cms-note">
                Yayın notu (isteğe bağlı)
                <input
                  maxLength={200}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Örn. ürün açıklamaları güncellendi"
                />
              </label>
            )}
            <footer>
              <button
                className="cms-secondary"
                disabled={busy}
                onClick={() => setConfirmation(null)}
              >
                Vazgeç
              </button>
              <button
                className="cms-primary"
                disabled={busy || (confirmation === "publish" && !diffs.length)}
                onClick={() =>
                  void action(async () => {
                    if (!workspace) return;
                    if (confirmation === "publish") {
                      const saved = await save();
                      if (auth.role === "admin") {
                        await request(
                          "approvals",
                          { method: "POST", body: JSON.stringify({ device, note }) },
                          auth.csrf,
                        );
                        setApprovalSent(true);
                        setNotice("Değişiklikler root onayına gönderildi.");
                        setNote("");
                        setConfirmation(null);
                        return;
                      }
                      const result = await request<Omit<Workspace, "catalog">>(
                        "publish",
                        {
                          method: "POST",
                          body: JSON.stringify({ device, revision: saved.revision, note }),
                        },
                        auth.csrf,
                      );
                      loaded({ ...result, catalog: workspace.catalog });
                      setNotice("İçerik yayınlandı. Yeni sürüm v" + result.version);
                      setNote("");
                    } else {
                      const result = await request<Omit<Workspace, "catalog">>(
                        "restore",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            device,
                            revision: workspace.revision,
                            version: confirmation.version,
                          }),
                        },
                        auth.csrf,
                      );
                      loaded({ ...result, catalog: workspace.catalog });
                      setNotice("Sürüm taslağa alındı. Önizleyip yayınlayabilirsiniz.");
                    }
                    setConfirmation(null);
                  })
                }
              >
                {busy ? (
                  <Busy />
                ) : confirmation === "publish" ? (
                  <Globe size={16} />
                ) : (
                  <RotateCcw size={16} />
                )}
                Onayla
              </button>
            </footer>
          </Dialog>
        )}
      </div>}
    </>
  );
}
