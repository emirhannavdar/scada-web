import {setPreviewReview} from "./cms-review-state";
import type { VisualWorkspace } from "./cms-visual-model";
import { refreshCmsContent } from "./i18n";
import { setCmsDesign, type SiteDesign } from "./cms-design";
import { applyCmsCollections } from "./cms-collection-runtime";
import type { CmsCollections } from "./cms-collections";
import { applyRuntimeFields, resetRuntimeContent } from "@/content/site";
import { setCmsEntries, type CmsEntry } from "./cms-state";
type ContentPayload = {
  entries: CmsEntry[];
  review?: VisualWorkspace;
  collections?: CmsCollections;
  design?: SiteDesign;
  variants?: Record<"desktop" | "mobile", ContentPayload>;
};
type ContentStatus='ready'|'failed'|'retrying';
let status:ContentStatus='ready';
const statusListeners=new Set<()=>void>();
export const contentStatus=()=>status;
export function subscribeContentStatus(listener:()=>void){statusListeners.add(listener);return()=>{statusListeners.delete(listener)}}
function updateContentStatus(next:ContentStatus){status=next;statusListeners.forEach(fn=>fn())}
let stopResponsive: (() => void) | undefined;
export async function initializeContent() {
  if(status!=='ready')updateContentStatus('retrying');
  const params = new URLSearchParams(location.search),
    preview = params.get("cms-preview") === "1";
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 3000);
  try {
    const forced = params.get("cms-device") === "mobile" ? "mobile" : "desktop",
      version = params.get("cms-version"),
      approval = params.get("cms-approval");
    const response = await fetch(
      preview
        ? "/api/cms/preview?device=" +
            forced +
            (approval
              ? "&approval=" + encodeURIComponent(approval)
              : version
                ? "&version=" + encodeURIComponent(version)
                : "")
        : "/api/content",
      { credentials: "same-origin", cache: "no-cache", signal: controller.signal },
    );
    if (!response.ok)
      throw Object.assign(Error("İçerik yüklenemedi."), { status: response.status });
    const payload = (await response.json()) as ContentPayload;
    if (!Array.isArray(payload.entries)) throw Error("Geçersiz içerik.");
    stopResponsive?.();stopResponsive=undefined;
    if(preview && payload.review)setPreviewReview(payload.review,params.get("cms-edit")!=="1");
    const media = window.matchMedia("(max-width:760px)");
    function apply() {
      const active = payload.variants?.[media.matches ? "mobile" : "desktop"] ?? payload;
      resetRuntimeContent();
      setCmsDesign(active.design);
      applyRuntimeFields(active.entries.filter((e) => e.target === "data"));
      const collectionEntries = applyCmsCollections(active.collections);
      setCmsEntries([...active.entries, ...collectionEntries]);
      refreshCmsContent();
    }
    apply();
    updateContentStatus('ready');
    if (!preview && payload.variants) {
      media.addEventListener("change", apply);
      stopResponsive = () => media.removeEventListener("change", apply);
    }
    if (preview) {
      document.documentElement.dataset["cmsPreview"] = "true";
      if (new URLSearchParams(location.search).get("cms-edit") === "1" && window.parent !== window)
        document.documentElement.dataset["cmsVisual"] = "true";
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex, nofollow";
      document.head.append(meta);
    }
  } catch (error) {
    if (preview) {
      if (window.parent !== window && new URLSearchParams(location.search).get("cms-edit") === "1")
        window.parent.postMessage(
          {
            channel: "scadawatt-visual",
            type: "preview-error",
            status: (error as { status?: number }).status || 0,
          },
          location.origin,
        );
      document.body.innerHTML = "";
      const box = document.createElement("div");
      box.style.cssText = "font:18px system-ui;padding:50px;line-height:1.7";
      box.textContent = "Taslak önizlemesi açılamadı. /admin üzerinden giriş yapıp tekrar deneyin.";
      const link = document.createElement("a");
      link.href = "/admin";
      link.textContent = " Yönetim paneline dön";
      const retry=document.createElement("button");retry.type="button";retry.textContent="Yeniden dene";retry.addEventListener("click",()=>location.reload());
      box.append(link,retry);
      document.body.append(box);
      return false;
    }
    updateContentStatus('failed');
    console.warn("CMS erişilemiyor; paket içeriği gösteriliyor.");
  } finally {
    clearTimeout(timer);
  }
  return true;
}

/** Authenticated editor messages use the same runtime path without remounting WebGL. */
export function applyEditorContent(workspace: VisualWorkspace) {
  const entries: CmsEntry[] = workspace.catalog.fields
    .filter((f) => ["data", "copy", "asset"].includes(f.target))
    .map((f) => ({
      ...f,
      ...(workspace.values[f.id] ?? f.default),
      target: f.target as CmsEntry["target"],
    }));
  resetRuntimeContent();
  applyRuntimeFields(entries.filter((e) => e.target === "data"));
  const collectionEntries = applyCmsCollections(workspace.collections);
  setCmsEntries([...entries, ...collectionEntries]);
  refreshCmsContent();
}
