import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  Eye,
  Globe,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Monitor,
  MousePointer2,
  Navigation,
  PanelRightClose,
  Save,
  Settings2,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import { DesignEditor } from "./DesignEditor";
import { emptyDesign, safeSelector, designKey, type DesignSelection } from "@/lib/cms-design";
import { ChangeReview } from "./ChangeReview";
import {
  cmsChanges,
  revertCmsChange,
  revertAllCmsChanges,
  type CmsChange,
} from "@/lib/cms-changes";
import { CollectionsEditor } from "./CollectionsEditor";
import { journeyStages } from "@/lib/cms-editor";
import {
  visualTargets,
  updateVisualTarget,
  visualPath,
  type VisualWorkspace,
  type VisualTarget,
  type VisualValue,
} from "@/lib/cms-visual-model";
import { collectionChangeCount, type CollectionKind } from "@/lib/cms-collections";
import "./visual-editor.css";
type Media = { id: string; url: string; name: string; size: number };
type ApprovalNotice = {
  id: number;
  created: string;
  device: "desktop" | "mobile";
  note?: string;
  status: "pending" | "approved" | "revision" | "rejected";
  reviewer_comment?: string;
  reviewed?: string;
};
const canon = (value: unknown) => JSON.stringify(value);
async function api<T>(path: string, csrf: string, options: RequestInit = {}) {
  const response = await fetch("/api/cms/" + path, {
    ...options,
    credentials: "same-origin",
    headers: {
      "X-ScadaWatt-Request": "cms",
      ...(typeof options.body === "string" ? { "Content-Type": "application/json" } : {}),
      "X-CSRF-Token": csrf,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(Error(data.error || "İşlem tamamlanamadı."), { status: response.status });
  return data as T;
}
export function VisualEditor({
  initial,
  active = true,
  csrf,
  role = "admin",
  onClassic,
  onUnauthorized,
}: {
  active?: boolean;
  initial: VisualWorkspace;
  csrf: string;
  role?: "root" | "admin";
  onClassic: (workspace: VisualWorkspace) => void;
  onUnauthorized: () => void;
}) {
  const [saved, setSaved] = useState(initial),
    [draft, setDraft] = useState(initial),
    [mode, setMode] = useState<"edit" | "browse">("edit"),
    [language, setLanguage] = useState<"tr" | "en">("tr"),
    [path, setPath] = useState("/"),
    [frameVersion, setFrameVersion] = useState(0),
    [ready, setReady] = useState(false),
    [mobile, setMobile] = useState(initial.device === "mobile"),
    [selection, setSelection] = useState<string[]>([]),
    [selectedId, setSelectedId] = useState(""),
    [collection, setCollection] = useState<CollectionKind | null>(null),
    [collectionRequest, setCollectionRequest] = useState<
      { key: number; mode: string; record?: string } | undefined
    >(),
    [recordEditing, setRecordEditing] = useState(false),
    [media, setMedia] = useState<Media[]>([]),
    [picker, setPicker] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [approvalSent, setApprovalSent] = useState(false),
    [approvalNotices, setApprovalNotices] = useState<ApprovalNotice[]>([]),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [reviewing, setReviewing] = useState(false),
    [publish, setPublish] = useState(false),
    [note, setNote] = useState(""),
    [scene, setScene] = useState("");
  const [wordMode] = useState(false);
  const frameSource = useRef(visualPath("/") + "&cms-device=" + (initial.device ?? "desktop"));
  const [selectedDesign, setSelectedDesign] = useState<DesignSelection | null>(null),
    [selectedDesigns,setSelectedDesigns] = useState<DesignSelection[]>([]),
    [inspector, setInspector] = useState<"content" | "design">("content"),
    [designOpen, setDesignOpen] = useState(false),
    [theme, setTheme] = useState<"light" | "dark">("light");
  const [messages,setMessages]=useState<{id:number;sender:string;recipient:string;body:string;created:string;read_at:string|null}[]>([]);
  const [messageUsers,setMessageUsers]=useState<{id:number;email:string;role:string}[]>([]);
  const [messageText,setMessageText]=useState(''),[messageRecipients,setMessageRecipients]=useState<number[]>([]),[messageAll,setMessageAll]=useState(true);
  useEffect(()=>{
    let alive=true;
    const refresh=()=>void api<{items:typeof messages}>('messages',csrf).then(result=>{if(alive)setMessages(result.items)}).catch(()=>undefined);
    refresh();const timer=window.setInterval(refresh,30000);
    if(role==='root')void api<{items:typeof messageUsers}>('users',csrf).then(result=>{if(alive)setMessageUsers(result.items.filter(user=>user.role==='admin'))}).catch(()=>undefined);
    return()=>{alive=false;clearInterval(timer)};
  },[csrf,role,notificationsOpen]);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 1280, height: 800 });
  const iframe = useRef<HTMLIFrameElement>(null),
    upload = useRef<HTMLInputElement>(null),
    position = useRef(0),
    restore = useRef<number | null>(null),
    latest = useRef({ draft, saved, mode, language, wordMode, path, theme }),
    operation = useRef(false),
    dirtyRef = useRef(false),
    imageCallback = useRef<((url: string) => void) | null>(null),
    sceneRef = useRef("");
  latest.current = { draft, saved, mode, language, wordMode, path, theme };
  useEffect(()=>setSelectedDesigns([]),[path,mobile]);
  sceneRef.current = scene;
  useEffect(() => {
    if (
      initial.revision >= saved.revision &&
      (initial.revision !== saved.revision || initial.device !== saved.device)
    ) {
      setSaved(initial);
      setDraft(initial);
      setMobile(initial.device === "mobile");
      setSelectedDesign(null);
      setSelection([]);
      setSelectedId("");
      setCollection(null);
      setDesignOpen(false);
    }
  }, [initial]);
  const targets = useMemo(() => visualTargets(draft, saved), [draft, saved]),
    target = targets.find((t) => t.id === selectedId),
    dirty =
      canon(draft.values) !== canon(saved.values) ||
      canon(draft.collections) !== canon(saved.collections) ||
      canon(draft.design ?? emptyDesign()) !== canon(saved.design ?? emptyDesign()),
    unpublished =
      canon(draft.values) !== canon(saved.published) ||
      canon(draft.collections) !== canon(saved.publishedCollections);
  dirtyRef.current = dirty || recordEditing;
  const device = mobile ? "mobile" : "desktop";
  const send = useCallback(
    (data: Record<string, unknown>) =>
      iframe.current?.contentWindow?.postMessage(
        { channel: "scadawatt-visual", ...data },
        location.origin,
      ),
    [],
  );
  const configure = useCallback(() => {
    const current = latest.current;
    send({
      type: "configure",
      wordMode: current.wordMode,
      content: current.draft,
      targets: visualTargets(current.draft, current.saved),
      design: current.draft.design ?? emptyDesign(),
      device: current.draft.device ?? "desktop",
      editing: current.mode === "edit",
      language: current.language,
      ...(restore.current !== null ? { restoreY: restore.current } : {}),
    });
    restore.current = null;
    if (sceneRef.current && current.mode === "edit")
      send({ type: "scene", stage: Number(sceneRef.current) });
  }, [send]);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== iframe.current?.contentWindow ||
        e.data?.channel !== "scadawatt-visual"
      )
        return;
      const data = e.data;
      if (data.type === "preview-error") {
        setReady(true);
        setError("Taslak sayfa açılamadı. Yönetimden oturumunuzu kontrol edip tekrar deneyin.");
        if (data.status === 401) onUnauthorized();
      } else if (data.type === "ready") {
        setReady(true);
        configure();
      } else if(data.type === "select-many" && Array.isArray(data.designs)) {
        const descriptors = data.designs.filter((d:DesignSelection)=>d&&d.page===latest.current.path.split('?')[0]&&safeSelector(d.selector)&&d.kind==='text'&&d.key===designKey(d.page,d.selector));
        if(!descriptors.length)return;
        setSelectedDesigns(descriptors);setSelectedDesign(descriptors[0]);setDesignOpen(true);setInspector('design');setCollection(null);setSelection([]);setSelectedId('');
      } else if (data.type === "select" && Array.isArray(data.ids)) {
        setSelectedDesigns([]);
        const available = new Set(visualTargets(latest.current.draft).map((t) => t.id)),
          ids = data.ids.filter(
            (id: unknown): id is string => typeof id === "string" && available.has(id),
          );
        const descriptor = data.design as DesignSelection | undefined;
        const validDesign = Boolean(
          descriptor &&
          typeof descriptor.page === "string" &&
          safeSelector(descriptor.selector) &&
          descriptor.key === designKey(descriptor.page, descriptor.selector, descriptor.fragment),
        );
        if (!ids.length && !validDesign) return;
        if (validDesign) {
          setSelectedDesign(descriptor!);
          setDesignOpen(true);
          if (!ids.length || descriptor?.fragment) setInspector("design");
        } else setSelectedDesign(null);
        if (recordEditing && !confirm("Açık kayıt düzenlemesi iptal edilsin mi?")) return;
        setCollection(null);
        setSelection(ids);
        setSelectedId(ids[0] || "");
        setError("");
      } else if (data.type === "move") {
        const selected = selectedDesign,
          device = latest.current.draft.device ?? "desktop",
          limit = device === "mobile" ? 40 : 120;
        if (
          !selected ||
          selected.locked ||
          data.key !== selected.key ||
          data.page !== selected.page ||
          data.selector !== selected.selector ||
          data.device !== device ||
          ![data.x, data.y].every(
            (n) => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= limit,
          )
        )
          return;
        setDraft((w) => {
          const design = structuredClone(w.design ?? emptyDesign());
          const item = design.elements[selected.key] ?? {
            page: selected.page,
            selector: selected.selector,
            label: selected.label,
            kind: selected.kind,
            ...(selected.fragment ? { fragment: selected.fragment } : {}),
            desktop: {},
            mobile: {},
          };
          const profile=`${device}${latest.current.theme==='dark'?'Dark':'Light'}` as const;
          item[profile] = { ...item[device], ...item[profile], x: data.x, y: data.y };
          design.elements[selected.key] = item;
          return { ...w, design };
        });
        setDesignOpen(true);
        setInspector("design");
        setNotice(
          (device === "mobile" ? "Mobil" : "Masaüstü") + " konumu güncellendi. Taslağı kaydedin.",
        );
      } else if (data.type === "theme") {
        setTheme(data.dark ? "dark" : "light");
      } else if (
        data.type === "collection" &&
        ["products", "solutions", "plans"].includes(data.kind)
      ) {
        if (recordEditing && !confirm("Açık kayıt düzenlemesi iptal edilsin mi?")) return;
        setSelection([]);
        setSelectedId("");
        setCollection(data.kind);
        setCollectionRequest({
          key: Date.now(),
          mode: data.mode === "add" ? "add" : "list",
          ...(typeof data.record === "string" ? { record: data.record } : {}),
        });
      } else if (data.type === "position") {
        if (typeof data.y === "number") position.current = data.y;
        if (typeof data.path === "string") {
          const url = new URL(data.path, location.origin);
          if (url.pathname !== latest.current.path) {
            setSelection([]);
            setSelectedId("");
            setSelectedDesign(null);
            setDesignOpen(false);
            setCollection(null);
            setScene("");
          }
          setPath(url.pathname);
        }
      } else if (data.type === "hint" && typeof data.text === "string") setNotice(data.text);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [configure, recordEditing, selectedDesign]);
  useEffect(() => {
    if (ready) send({ type: "visibility", active });
  }, [active, ready, send]);
  useEffect(() => {
    void api<{ items: ApprovalNotice[] }>("approvals", csrf)
      .then(({ items }) => {
        setApprovalNotices(items);
        const latest = items[0];
        setApprovalSent(role === "admin" && latest?.status === "pending");
        if (!latest) return;
        if (latest.status === "revision")
          setNotice(
            "Root revize istedi: " + (latest.reviewer_comment || "Değişiklikleri gözden geçirin."),
          );
        else if (latest.status === "rejected")
          setNotice(
            "Son yayın talebi root tarafından reddedildi" +
              (latest.reviewer_comment ? ": " + latest.reviewer_comment : "."),
          );
        else if (latest.status === "pending") setNotice("Yayın talebiniz root onayını bekliyor.");
      })
      .catch(() => undefined);
  }, [role, csrf]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (ready) configure();
  }, [targets, draft.design, mode, language, wordMode, ready, configure]);
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!recordEditing) void run(saveDraft);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [draft, saved, recordEditing]);
  useEffect(() => {
    if (!picker && !publish && !reviewing) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>(".visual-modal");
    dialog?.querySelector<HTMLElement>("button,input")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPicker(false);
        setPublish(false);
        setReviewing(false);
        imageCallback.current = null;
      }
      if (e.key === "Tab") {
        const elements = dialog?.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input,select,textarea,a[href]",
          ),
          first = elements?.[0],
          last = elements?.[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [picker, publish, reviewing]);
  async function run(fn: () => Promise<unknown>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      const err = e as Error & { status?: number };
      setError(err.message);
      if (err.status === 401) onUnauthorized();
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  function refresh() {
    restore.current = position.current;
    frameSource.current = visualPath(path) + "&cms-device=" + device;
    setReady(false);
    setFrameVersion((v) => v + 1);
  }
  async function saveDraft() {
    if (recordEditing) throw Error("Önce açık kayıtta Listeye uygula düğmesini kullanın.");
    if (!dirty) return saved;
    const result = await api<Omit<VisualWorkspace, "catalog">>("draft", csrf, {
      method: "PUT",
      body: JSON.stringify({
        device,
        revision: saved.revision,
        values: draft.values,
        collections: draft.collections,
        design: draft.design ?? emptyDesign(),
      }),
    });
    const next = { ...result, catalog: saved.catalog };
    setSaved(next);
    setDraft(next);
    setNotice("Taslak kaydedildi. Ziyaretçiler etkilenmedi.");
    return next;
  }
  async function switchDevice(nextMobile: boolean) {
    if (nextMobile === mobile) return;
    if (recordEditing) throw Error("Önce açık kaydı uygulayın.");
    if (dirty) await saveDraft();
    const next = await api<VisualWorkspace>(
      "workspace?device=" + (nextMobile ? "mobile" : "desktop"),
      csrf,
    );
    setSaved(next);
    setDraft(next);
    setMobile(nextMobile);
    setSelection([]);
    setSelectedId("");
    setSelectedDesign(null);
    setDesignOpen(false);
    setCollection(null);
    restore.current = position.current;
    setNotice(
      (nextMobile ? "Mobil" : "Masaüstü") +
        " düzenleme açık. Değişiklikler yalnız bu görünüme uygulanır.",
    );
  }
  async function navigate(next: string) {
    if (recordEditing) throw Error("Önce açık kayıtta Listeye uygula düğmesini kullanın.");
    if (dirty) await saveDraft();
    position.current = 0;
    restore.current = 0;
    setScene("");
    setPath(next);
    setSelectedDesign(null);
    setDesignOpen(false);
    setSelection([]);
    setSelectedId("");
    setCollection(null);
    send({ type: "navigate", path: next });
  }
  async function openMedia(callback: (url: string) => void) {
    imageCallback.current = callback;
    const result = await api<{ items: Media[] }>("media", csrf);
    setMedia(result.items);
    setPicker(true);
  }
  function applyImage(url: string) {
    imageCallback.current?.(url);
    imageCallback.current = null;
    setPicker(false);
  }
  async function uploadImage(file: File) {
    if (file.size > 8 * 1024 * 1024) throw Error("Görsel en fazla 8 MB olabilir.");
    const item = await api<Media>("media", csrf, {
      method: "POST",
      body: file,
      headers: {
        "Content-Type": "application/octet-stream",
        "X-File-Name": encodeURIComponent(file.name),
      },
    });
    applyImage(item.url);
    setNotice("Görsel seçildi. Taslağı kaydederek sayfada uygulayın.");
  }
  function change(value: VisualValue) {
    if (!target) return;
    setDraft((w) => updateVisualTarget(w, target, value));
    setNotice("Değişiklik hazır. Taslağı kaydet ile sayfaya uygulayın.");
  }
  function closeDrawer() {
    if (recordEditing && !confirm("Açık kayıt düzenlemesi iptal edilsin mi?")) return;
    setCollection(null);
    setSelection([]);
    setSelectedId("");
    setSelectedDesign(null);
    setDesignOpen(false);
    send({ type: "release" });
    setScene("");
  }
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width && rect.height) setStageSize({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const hasInspector = Boolean(target || collection || designOpen),
    previewWidth = mobile ? 390 : Math.max(761, stageSize.width),
    previewScale = Math.max(
      0.15,
      mobile
        ? Math.min(stageSize.width / 390, stageSize.height / 680)
        : stageSize.width / previewWidth,
    );
  const changes = useMemo(() => cmsChanges(draft), [draft]);
  function revert(change: CmsChange) {
    setDraft((current) => revertCmsChange(current, change));
    setNotice("Değişiklik taslakta geri alındı. Kalıcı olması için Taslağı kaydet kullanın.");
  }
  function revertAll() {
    setDraft((current) => revertAllCmsChanges(current));
    setNotice("Taslak yayındaki içeriğe döndürüldü. Kalıcı olması için Taslağı kaydedin.");
  }

  return (
    <div
      className={
        "cms-app visual-cms " +
        (hasInspector ? "has-inspector " : "") +
        (collection ? "has-collection" : "")
      }
    >
      <input
        ref={upload}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.currentTarget.value = "";
          if (file) void run(() => uploadImage(file));
        }}
      />
      <header className="visual-topbar">
        <div className="visual-brand">
          <img src="/assets/scadawatt-logo.png" alt="ScadaWatt" />
          <span>
            Görsel editör
            <small>
              Yayın v{saved.version} ·{" "}
              {dirty ? "Kaydedilmedi" : changes.length ? "Taslak hazır" : "Yayınla aynı"}
            </small>
          </span>
        </div>
        <div className="visual-mode" role="group" aria-label="Çalışma modu">
          <button aria-pressed={mode === "edit"} onClick={() => setMode("edit")}>
            <MousePointer2 size={15} />
            Düzenle
          </button>
          <button
            aria-pressed={mode === "browse"}
            onClick={() => {
              setMode("browse");
              setScene("");
            }}
          >
            <Navigation size={15} />
            Önizleme
          </button>
        </div>
        <select
          aria-label="Düzenlenecek sayfa"
          value={
            [
              "/",
              "/urunler",
              "/cozumler",
              "/paketler",
              "/scada-yazilimi",
              "/hakkimizda",
              "/iletisim",
            ].includes(path)
              ? path
              : ""
          }
          onChange={(e) => void run(() => navigate(e.target.value))}
        >
          {![
            "/",
            "/urunler",
            "/cozumler",
            "/paketler",
            "/scada-yazilimi",
            "/hakkimizda",
            "/iletisim",
          ].includes(path) && <option value="">Detay sayfası</option>}
          {[
            ["/", "Ana sayfa"],
            ["/urunler", "Donanımlar"],
            ["/cozumler", "Çözümler"],
            ["/paketler", "Paketler"],
            ["/scada-yazilimi", "SCADA Yazılımı"],
            ["/hakkimizda", "Hakkımızda"],
            ["/iletisim", "İletişim"],
          ].map(([url, label]) => (
            <option key={url} value={url}>
              {label}
            </option>
          ))}
        </select>
        <div className="visual-devices">
          <button
            aria-label="Masaüstü görünümü"
            aria-pressed={!mobile}
            disabled={busy || recordEditing}
            onClick={() => void run(() => switchDevice(false))}
          >
            <Monitor size={17} />
          </button>
          <button
            aria-label="Mobil görünüm"
            aria-pressed={mobile}
            disabled={busy || recordEditing}
            onClick={() => void run(() => switchDevice(true))}
          >
            <Smartphone size={17} />
          </button>
        </div>
        <select
          aria-label="Önizleme dili"
          value={language}
          onChange={(e) => setLanguage(e.target.value as "tr" | "en")}
        >
          <option value="tr">TR</option>
          <option value="en">EN</option>
        </select>
        <div className="visual-top-actions">
          {role === "root" && (
            <button
              title="Kullanıcılar, görseller ve yayın geçmişi"
              onClick={() => void run(async () => onClassic(dirty ? await saveDraft() : saved))}
            >
              <Settings2 size={17} />
              <span>Yönetim</span>
            </button>
          )}
          <button
            className="visual-notification-button"
            aria-label="Bildirimler ve inceleme mesajları"
            aria-expanded={notificationsOpen}
            title="Bildirimler"
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Bell size={17} />
            <span>Bildirimler</span>
            {(approvalNotices.some((item) => item.status === "revision") || messages.some(item=>!item.read_at)) && <b />}
          </button>
          <button
            aria-label={`Değişiklikleri gör (${changes.length})`}
            title="Değişiklikleri gör"
            disabled={busy || recordEditing}
            onClick={() => setReviewing(true)}
          >
            <Eye size={16} />
            <span>Değişiklikleri gör</span>
            <b className="visual-review-count">{changes.length}</b>
          </button>
          <button disabled={busy || recordEditing || !dirty} onClick={() => void run(saveDraft)}>
            <Save size={16} />
            <span>Taslağı kaydet</span>
          </button>
          <button
            className="visual-publish"
            disabled={busy || recordEditing || !changes.length || approvalSent}
            onClick={() => setPublish(true)}
          >
            <Globe size={16} />
            {role === "root"
              ? "Yayınla"
              : approvalSent
                ? "Root onayına gönderildi"
                : "Root onayına gönder"}
          </button>
          <button
            title="Çıkış yap"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                if (dirty && !confirm("Kaydedilmemiş değişiklikleriniz var. Çıkış yapılsın mı?"))
                  return;
                await api("logout", csrf, { method: "POST" });
                onUnauthorized();
              })
            }
          >
            <LogOut size={16} />
            <span>Çıkış</span>
          </button>
        </div>
      </header>
      {notificationsOpen && (
        <aside className="visual-notifications" aria-label="Bildirim geçmişi">
          <header>
            <div>
              <small>YAYIN İŞ AKIŞI</small>
              <h2>Bildirimler</h2>
            </div>
            <button aria-label="Bildirimleri kapat" onClick={() => setNotificationsOpen(false)}>
              <X size={17} />
            </button>
          </header>
          <div>
            {role==='root' && <form className="visual-message-compose" onSubmit={event=>{event.preventDefault();void run(async()=>{
              const result=await api<{sent:number}>('messages',csrf,{method:'POST',body:JSON.stringify({message:messageText,recipients:messageAll?'all':messageRecipients})});
              setMessageText('');setNotice(`${result.sent} admine bildirim gönderildi.`);
              setMessages((await api<{items:typeof messages}>('messages',csrf)).items);
            })}}>
              <h3>Adminlere mesaj gönder</h3>
              <label><input type="checkbox" checked={messageAll} onChange={e=>setMessageAll(e.target.checked)}/>Tüm adminler</label>
              {!messageAll && <fieldset><legend>Alıcılar</legend>{messageUsers.map(user=><label key={user.id}><input type="checkbox" checked={messageRecipients.includes(user.id)} onChange={e=>setMessageRecipients(current=>e.target.checked?[...current,user.id]:current.filter(id=>id!==user.id))}/>{user.email}</label>)}</fieldset>}
              <label>Mesaj<textarea required maxLength={4000} rows={4} value={messageText} onChange={e=>setMessageText(e.target.value)}/></label>
              <button disabled={busy||!messageText.trim()||(!messageAll&&!messageRecipients.length)} type="submit">Bildirim gönder</button>
            </form>}
            {messages.map(item=><article key={`message-${item.id}`}><span>Root mesajı{!item.read_at&&role==='admin'?' · Yeni':''}</span><p style={{whiteSpace:'pre-wrap'}}>{item.body}</p>{role==='root'&&<small>Alıcı: {item.recipient}</small>}<time>{new Date(item.created).toLocaleString('tr-TR')}</time>{role==='admin'&&!item.read_at&&<button onClick={()=>void run(async()=>{await api(`messages/${item.id}/read`,csrf,{method:'PATCH'});setMessages(current=>current.map(message=>message.id===item.id?{...message,read_at:new Date().toISOString()}:message))})}>Okundu olarak işaretle</button>}</article>)}
            {approvalNotices.map((item) => (
              <article key={item.id} className={`is-${item.status}`}>
                <span>
                  {item.status === "pending"
                    ? "Root onayı bekleniyor"
                    : item.status === "approved"
                      ? "Yayınlandı"
                      : item.status === "revision"
                        ? "Revize istendi"
                        : "Reddedildi"}
                </span>
                <strong>{item.device === "mobile" ? "Mobil" : "Masaüstü"} değişiklikleri</strong>
                {item.reviewer_comment && <p>{item.reviewer_comment}</p>}
                {item.note && (
                  <p className="visual-notification-note">Gönderilen not: {item.note}</p>
                )}
                <time>
                  {new Date(item.reviewed || item.created).toLocaleString("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </article>
            ))}
            {!approvalNotices.length && !messages.length && (
              <p className="visual-notification-empty">Henüz bir yayın mesajı yok.</p>
            )}
          </div>
        </aside>
      )}
      <div className="visual-subbar">
        <span>
          {mode === "edit"
            ? "Metne bir kez tıkla: tamamını seç. Kelimeye çift tıkla: yalnız o kelimeyi biçimlendir."
            : "Bağlantılara tıklayabilir ve siteyi ziyaretçi gibi gezebilirsin."}
        </span>
        {path === "/" && (
          <label>
            Animasyon sahnesi
            <select
              aria-label="Animasyon sahnesi"
              value={scene}
              onChange={(e) => {
                setScene(e.target.value);
                if (e.target.value) {
                  setMode("edit");
                  send({ type: "scene", stage: Number(e.target.value) });
                  const ids = targets
                    .filter((t) => t.stage === Number(e.target.value))
                    .map((t) => t.id);
                  setCollection(null);
                  setSelection(ids);
                  setSelectedId(ids[0] || "");
                } else send({ type: "release" });
              }}
            >
              <option value="">Kaydırarak gez</option>
              {journeyStages.map((name, index) => (
                <option key={name} value={String(index)}>
                  {String(index + 1).padStart(2, "0")} · {name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          onClick={() => {
            if (recordEditing && !confirm("Açık kayıt düzenlemesi iptal edilsin mi?")) return;
            setSelection([]);
            setSelectedId("");
            setCollection("products");
            setCollectionRequest({ key: Date.now(), mode: "list" });
          }}
        >
          Donanım / çözüm / paket
        </button>
        <button
          onClick={() => {
            if (recordEditing && !confirm("Açık kayıt düzenlemesi iptal edilsin mi?")) return;
            setCollection(null);
            setDesignOpen(true);
            setInspector("design");
          }}
        >
          Tasarım / renkler
        </button>
        <span className="visual-draft-label">
          <i />
          {mobile ? "Mobil" : "Masaüstü"} taslağı · Sadece bu görünüm değişir
        </span>
      </div>
      {error && (
        <div className="visual-feedback error" role="alert">
          {error}
          <button
            onClick={() =>
              void run(async () => {
                if (
                  dirty &&
                  !confirm("Kaydedilmemiş değişiklikler silinecek. Sunucudan yenilensin mi?")
                )
                  return;
                const next = await api<VisualWorkspace>("workspace?device=" + device, csrf);
                setSaved(next);
                setDraft(next);
                refresh();
              })
            }
          >
            Sunucudan yenile
          </button>
          <button onClick={() => setError("")} aria-label="Hatayı kapat">
            <X size={15} />
          </button>
        </div>
      )}
      {notice && (
        <div className="visual-feedback" role="status">
          {notice}
          <button aria-label="Bildirimi kapat" onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}
      <div className={`visual-stage ${mobile ? "is-mobile" : ""}`} ref={stageRef}>
        <iframe
          style={{
            width: previewWidth,
            height: stageSize.height / previewScale,
            transform: "scale(" + previewScale + ")",
            transformOrigin: "top left",
            flexShrink: 0,
          }}
          key={frameVersion}
          ref={iframe}
          src={frameSource.current}
          title="Site üzerinde düzenleme"
        />
        {!ready && (
          <div className="visual-wait">
            <LoaderCircle size={18} />
            Taslak sayfa hazırlanıyor…
          </div>
        )}
      </div>
      {(target || collection || designOpen) && (
        <aside
          className={`visual-drawer ${collection ? "is-collection" : ""}`}
          aria-label="Seçilen içeriği düzenle"
        >
          <header>
            <div>
              <small>
                {collection
                  ? "LİSTE YÖNETİMİ"
                  : inspector === "design"
                    ? "TASARIM / YERLEŞİM"
                    : target?.group}
              </small>
              <h2>
                {collection
                  ? "Ekle, düzenle, sırala."
                  : inspector === "design"
                    ? "Görünümü düzenle."
                    : "Seçtiğin alan."}
              </h2>
            </div>
            <button aria-label="Düzenleme panelini kapat" onClick={closeDrawer}>
              <PanelRightClose size={20} />
            </button>
          </header>
          <div className="visual-drawer-body">
            {!collection && (
              <div className="visual-inspector-tabs" role="group" aria-label="Öğe düzenleme türü">
                <button
                  aria-pressed={inspector === "content"}
                  disabled={!target}
                  onClick={() => setInspector("content")}
                >
                  İçerik
                </button>
                <button
                  aria-pressed={inspector === "design"}
                  onClick={() => setInspector("design")}
                >
                  Tasarım / yerleşim
                </button>
              </div>
            )}
            {inspector === "design" && !collection ? (
              <DesignEditor
                design={draft.design ?? emptyDesign()}
                selected={selectedDesign}
                selections={selectedDesigns}
                onChange={(design) => setDraft((w) => ({ ...w, design }))}
                onParent={() => {
                  send({ type: "select-parent" });
                }}
                onTheme={(dark) => {
                  setTheme(dark ? "dark" : "light");
                  send({ type: "theme", dark });
                }}
                theme={theme}
                device={device}
              />
            ) : collection && draft.collections ? (
              <CollectionsEditor
                collections={draft.collections}
                kind={collection}
                onKind={(kind) => {
                  setCollection(kind);
                  setCollectionRequest(undefined);
                }}
                onChange={(collections) => setDraft((w) => ({ ...w, collections }))}
                onImage={(url, callback) => void run(() => openMedia(callback))}
                comparisonLabels={draft.catalog.comparisonLabels ?? []}
                onEditingChange={setRecordEditing}
                request={collectionRequest}
              />
            ) : (
              target && (
                <>
                  <p className="visual-field-name">{target.label}</p>
                  {selection.length > 1 && (
                    <label className="visual-label">
                      Bu öğedeki düzenlenebilir alanlar
                      <select
                        aria-label="Düzenlenecek içerik alanı"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                      >
                        {selection.map((id) => {
                          const t = targets.find((x) => x.id === id);
                          return t ? (
                            <option key={id} value={id}>
                              {t.group} / {t.label}
                            </option>
                          ) : null;
                        })}
                      </select>
                    </label>
                  )}
                  {target.kind === "boolean" ? (
                    <label className="visual-label">
                      <span>Özellik bu pakete dahil</span>
                      <input
                        aria-label="Özellik bu pakete dahil"
                        type="checkbox"
                        checked={Boolean(target.value.tr)}
                        onChange={(e) => change({ tr: e.target.checked, en: e.target.checked })}
                      />
                    </label>
                  ) : target.kind === "image" ? (
                    <div className="visual-image-editor">
                      <img src={String(target.value.tr)} alt="Seçili görsel" />
                      <button
                        onClick={() =>
                          void run(() => openMedia((url) => change({ tr: url, en: url })))
                        }
                      >
                        <ImagePlus size={16} />
                        Görseli değiştir / yükle
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="visual-label">
                        {target.kind === "text" ? "Türkçe / TR" : "Değer"}
                        <textarea
                          value={String(target.value.tr)}
                          rows={String(target.value.tr).length > 160 ? 7 : 3}
                          maxLength={12000}
                          onChange={(e) =>
                            change({
                              tr: e.target.value,
                              en: target.kind === "text" ? target.value.en : e.target.value,
                            })
                          }
                        />
                      </label>
                      {target.kind === "text" && (
                        <label className="visual-label">
                          English / EN
                          <textarea
                            lang="en"
                            value={String(target.value.en)}
                            rows={String(target.value.en).length > 160 ? 7 : 3}
                            maxLength={12000}
                            onChange={(e) => change({ ...target.value, en: e.target.value })}
                          />
                        </label>
                      )}
                    </>
                  )}
                  {target.collection && (
                    <button
                      className="visual-full-record"
                      onClick={() => {
                        setCollection(target.collection!);
                        setCollectionRequest({
                          key: Date.now(),
                          mode: "list",
                          ...(target.record ? { record: target.record } : {}),
                        });
                      }}
                    >
                      Bu kaydın tüm alanlarını düzenle →
                    </button>
                  )}
                  <p className="visual-help">
                    Metinler düz yazı olarak kaydedilir. Türkçe ve İngilizce alanlarını birlikte
                    güncelleyin.
                  </p>
                </>
              )
            )}
          </div>
          <footer>
            {recordEditing ? (
              <p>
                Önce açık kayıtta <strong>Listeye uygula</strong> düğmesine basın.
              </p>
            ) : (
              <>
                <button
                  disabled={busy || !dirty}
                  className="visual-publish"
                  onClick={() => void run(saveDraft)}
                >
                  <Check size={16} />
                  Uygula ve önizle
                </button>
                <small>Önce taslağa kaydeder. Yayınla demeden ziyaretçiler görmez.</small>
              </>
            )}
          </footer>
        </aside>
      )}
      {picker && (
        <div className="visual-modal-backdrop">
          <section className="visual-modal" role="dialog" aria-modal="true" aria-label="Görsel seç">
            <header>
              <h2>Görsel seç</h2>
              <button
                aria-label="Görsel penceresini kapat"
                onClick={() => {
                  setPicker(false);
                  imageCallback.current = null;
                }}
              >
                <X size={20} />
              </button>
            </header>
            <button disabled={busy} onClick={() => upload.current?.click()}>
              <Upload size={16} />
              Yeni görsel yükle · en fazla 8 MB
            </button>
            <div className="visual-media-grid">
              {media.map((item) => (
                <button key={item.id} onClick={() => applyImage(item.url)}>
                  <img src={item.url} alt={item.name} loading="lazy" />
                  <span>{item.name}</span>
                </button>
              ))}
              {!media.length && <p>Henüz yüklenmiş görsel yok. Yeni görsel yükleyebilirsiniz.</p>}
            </div>
            <p className="visual-help">
              Görsel silmek ve tüm yüklemeleri yönetmek için Yönetim → Görsel kütüphanesi.
            </p>
          </section>
        </div>
      )}
      {(publish || reviewing) && (
        <div className="visual-modal-backdrop">
          <section
            className="visual-modal cms-review-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={
              publish
                ? role === "root"
                  ? "İçeriği yayınla"
                  : "Root onayına gönder"
                : "Değişiklikleri gör"
            }
          >
            <header>
              <h2>
                {publish
                  ? role === "root"
                    ? "Yayınlamadan önce inceleyin."
                    : "Root onayına göndermeden önce inceleyin."
                  : "Yayına göre değişiklikler."}
              </h2>
              <button
                disabled={busy}
                onClick={() => {
                  setPublish(false);
                  setReviewing(false);
                }}
                aria-label="Değişiklik penceresini kapat"
              >
                <X size={20} />
              </button>
            </header>
            <p className="visual-help">
              <strong>{mobile ? "Mobil" : "Masaüstü"} görünüm</strong>{" "}
              {role === "root" ? "yayınlanacak" : "root incelemesine gönderilecek"}. Diğer görünüm
              değişmez.
            </p>
            <ChangeReview
              workspace={draft}
              onRevert={revert}
              onRevertAll={revertAll}
              disabled={busy}
            />
            <p className="cms-review-cancel-help">
              Pencereyi kapatmak taslağı silmez. İstemediğiniz değişiklik için Geri al kullanın.
            </p>
            {publish && (
              <label className="visual-label">
                {role === "root" ? "Yayın notu" : "Root için açıklama"}
                <input maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            )}
            <footer className="cms-review-footer">
              <button
                disabled={busy}
                onClick={() => {
                  setPublish(false);
                  setReviewing(false);
                }}
              >
                İncelemeyi kapat
              </button>
              <button
                disabled={busy || recordEditing || !dirty}
                onClick={() => void run(saveDraft)}
              >
                <Save size={16} />
                Taslağı kaydet
              </button>
              {publish ? (
                <button
                  className="visual-publish"
                  disabled={busy || !changes.length}
                  onClick={() =>
                    void run(async () => {
                      const current = await saveDraft();
                      if (role === "admin") {
                        await api("approvals", csrf, {
                          method: "POST",
                          body: JSON.stringify({ device, note }),
                        });
                        setApprovalSent(true);
                        const { items } = await api<{ items: ApprovalNotice[] }>("approvals", csrf);
                        setApprovalNotices(items);
                        setPublish(false);
                        setReviewing(false);
                        setNote("");
                        setNotice(
                          "Değişiklikler root onayına gönderildi. Root onaylamadan yayınlanmaz.",
                        );
                        return;
                      }
                      const result = await api<Omit<VisualWorkspace, "catalog">>("publish", csrf, {
                        method: "POST",
                        body: JSON.stringify({ device, revision: current.revision, note }),
                      });
                      const next = { ...result, catalog: saved.catalog };
                      setSaved(next);
                      setDraft(next);
                      setPublish(false);
                      setReviewing(false);
                      setNote("");
                      setNotice("İçerik yayınlandı. Yeni sürüm v" + next.version);
                    })
                  }
                >
                  <Globe size={16} />
                  {role === "root" ? "Onayla ve yayınla" : "Onay talebi gönder"}
                </button>
              ) : (
                <button
                  className="visual-publish"
                  disabled={busy || !changes.length}
                  onClick={() => {
                    setReviewing(false);
                    setPublish(true);
                  }}
                >
                  <Globe size={16} />
                  {role === "root" ? "Yayına geç" : "Root onayına geç"}
                </button>
              )}
            </footer>
          </section>
        </div>
      )}

      {busy && (
        <div className="visual-busy" role="status">
          <LoaderCircle size={16} />
          İşlem sürüyor…
        </div>
      )}
    </div>
  );
}
