import {setPreviewReview} from "@/lib/cms-review-state";
import { pickWord } from "@/lib/cms-words";
import { getLanguage } from "@/lib/i18n";
import { applyEditorContent } from "@/lib/cms-runtime";
import { installCmsDrag } from "@/lib/cms-drag";
import {
  describeDesignElement,
  setCmsDesign,
  emptyDesign,
  type SiteDesign,
} from "@/lib/cms-design";
import { useExperience } from "@/components/site/ExperienceContext";
import { useEffect } from "react";
import { setLanguage } from "@/lib/i18n";
import { visualPath, type VisualTarget } from "@/lib/cms-visual-model";
import { pickVisualTarget } from "@/lib/cms-visual-pick";
/** Only mounted after authenticated draft initialization in a same-origin editor frame. */
export function VisualBridge() {
  const { setFieldNight, fieldNight } = useExperience();
  useEffect(() => {
    if (window.parent !== window)
      window.parent.postMessage(
        { channel: "scadawatt-visual", type: "theme", dark: fieldNight },
        location.origin,
      );
  }, [fieldNight]);
  useEffect(() => {
    if (window.parent === window || document.documentElement.dataset["cmsPreview"] !== "true")
      return;
    let targets: VisualTarget[] = [],
      editing = true,
      hover: HTMLElement | null = null,
      selected: HTMLElement | null = null,
      stage: number | undefined,
      raf = 0,
      pointerFrame = 0;
    let design: SiteDesign = emptyDesign(),
      device: "desktop" | "mobile" = "desktop",
      wordMode = false,
      previewActive = true;
    const root = document.createElement("div");
    root.dataset["cmsChrome"] = "true";
    root.innerHTML =
      '<style>html[data-cms-editing=true] :is(h1,h2,h3,h4,h5,h6,p,span,em,strong,b,small,label,legend,figcaption,blockquote,dt,dd,th,td,address,a,button,img){pointer-events:auto!important}[data-cms-hover]{outline:2px dashed #ec651b!important;outline-offset:5px!important;cursor:crosshair!important}[data-cms-selected]{outline:2px solid #ec651b!important;outline-offset:5px!important}.cms-frame-actions{position:fixed;z-index:2147483646;display:flex;gap:6px;pointer-events:auto;font:12px system-ui}.cms-frame-actions button{border:1px solid #ec651b;background:#fff;color:#18222d;padding:7px 11px;border-radius:6px;box-shadow:0 4px 18px #0002;cursor:pointer}.cms-frame-actions button:hover{background:#fff0e7}.cms-frame-label{position:fixed;pointer-events:none;z-index:2147483645;background:#ec651b;color:#fff;padding:4px 8px;border-radius:4px;font:11px system-ui;max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cms-preview-banner{display:none!important}</style><div class="cms-frame-label" hidden></div><div class="cms-frame-actions" hidden></div>';
    document.body.append(root);
    const label = root.querySelector<HTMLDivElement>(".cms-frame-label")!,
      actions = root.querySelector<HTMLDivElement>(".cms-frame-actions")!;
    const send = (data: Record<string, unknown>) =>
      window.parent.postMessage({ channel: "scadawatt-visual", ...data }, location.origin);
    let rangeStart: {x:number;y:number} | null = null, suppressClick = false;
    const multi = new Set<HTMLElement>();
    const marquee = document.createElement("div");
    marquee.style.cssText = "position:fixed;pointer-events:none;z-index:2147483647;border:1px solid #ec651b;background:#ec651b18;display:none";
    root.append(marquee);
    function beginRange(e: PointerEvent) {
      if (!editing || e.button !== 0 || !(e.target instanceof Element) || e.target.closest('[data-cms-chrome],input,textarea,select,canvas')) return;
      rangeStart = {x:e.clientX,y:e.clientY};
    }
    function moveRange(e: PointerEvent) {
      if (!rangeStart) return;
      if (Math.hypot(e.clientX-rangeStart.x,e.clientY-rangeStart.y)<8) return;
      Object.assign(marquee.style,{display:'block',left:Math.min(e.clientX,rangeStart.x)+'px',top:Math.min(e.clientY,rangeStart.y)+'px',width:Math.abs(e.clientX-rangeStart.x)+'px',height:Math.abs(e.clientY-rangeStart.y)+'px'});
    }
    function endRange(e: PointerEvent) {
      if (!rangeStart) return;
      const start=rangeStart;rangeStart=null;marquee.style.display='none';
      if(Math.hypot(e.clientX-start.x,e.clientY-start.y)<8)return;
      const box={left:Math.min(start.x,e.clientX),right:Math.max(start.x,e.clientX),top:Math.min(start.y,e.clientY),bottom:Math.max(start.y,e.clientY)};
      const candidates=Array.from(document.querySelectorAll<HTMLElement>('#root :is(h1,h2,h3,h4,h5,h6,p,label,legend,figcaption,blockquote,dt,dd,th,td,address,a,button,small,span)')).filter(element=>{
        if(!element.textContent?.trim() || element.closest('[data-cms-chrome],svg,[hidden]'))return false;
        const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.left<box.right&&r.right>box.left&&r.top<box.bottom&&r.bottom>box.top&&getComputedStyle(element).visibility!=='hidden'&&Boolean(describeDesignElement(element));
      });
      const elements=candidates.filter(element=>!candidates.some(parent=>parent!==element&&parent.contains(element)));
      if(!elements.length)return;
      multi.forEach(element=>element.removeAttribute('data-cms-selected'));multi.clear();selected?.removeAttribute('data-cms-selected');
      elements.forEach(element=>{multi.add(element);element.dataset['cmsSelected']='true'});
      selected=null;drag.sync();getSelection()?.removeAllRanges();pause(true);suppressClick=true;
      send({type:'select-many',designs:elements.map(describeDesignElement).filter(Boolean)});
    }
    const drag = installCmsDrag(root, {
      selected: () => selected,
      editing: () => editing && !wordMode,
      device: () => device,
      design: () => design,
      send,
    });
    const pause = (value: boolean) =>
      window.dispatchEvent(new CustomEvent("scadawatt:visual", { detail: { paused: value } }));
    function clearHover() {
      hover?.removeAttribute("data-cms-hover");
      hover = null;
      label.hidden = true;
    }
    function context(element: Element) {
      const owner = element.closest<HTMLElement>("[data-cms-collection]"),
        record = element.closest<HTMLElement>("[data-cms-record]");
      return {
        ...(owner?.dataset["cmsCollection"] ? { collection: owner.dataset["cmsCollection"] } : {}),
        ...(record?.dataset["cmsRecord"] ? { record: record.dataset["cmsRecord"] } : {}),
        ...(element.closest(".drone-copy") && stage !== undefined ? { stage } : {}),
        path: location.pathname,
      };
    }
    function pick(element: Element, point?: { x: number; y: number }) {
      return pickVisualTarget(element, targets, context, point);
    }
    function drawActions(element: Element | null) {
      const owner = element?.closest<HTMLElement>("[data-cms-collection]");
      if (!owner || !editing) {
        actions.hidden = true;
        return;
      }
      const kind = owner.dataset["cmsCollection"]!,
        record = element?.closest<HTMLElement>("[data-cms-record]")?.dataset["cmsRecord"];
      const rect = owner.getBoundingClientRect();
      actions.hidden = false;
      actions.style.top = Math.max(8, Math.min(innerHeight - 45, rect.top + 12)) + "px";
      actions.style.right = "18px";
      actions.replaceChildren();
      for (const [text, mode] of [
        ["+ Yeni kayıt", "add"],
        [record ? "Bu kaydı düzenle" : "Listeyi düzenle", "list"],
      ]) {
        const button = document.createElement("button");
        button.textContent = text!;
        button.onclick = () => {
          pause(true);
          send({ type: "collection", kind, record, mode });
        };
        actions.append(button);
      }
    }
    function paintPointer(e: PointerEvent) {
      if (!editing || !(e.target instanceof Element) || e.target.closest("[data-cms-chrome]"))
        return;
      const picked = pick(e.target, { x: e.clientX, y: e.clientY });
      if (picked?.element !== hover) {
        clearHover();
        if (picked) {
          hover = picked.element;
          hover.dataset["cmsHover"] = "true";
          const rect = hover.getBoundingClientRect();
          label.textContent = picked.found[0]!.label;
          label.style.left = Math.max(6, Math.min(innerWidth - 330, rect.left)) + "px";
          label.style.top = Math.max(6, rect.top - 28) + "px";
          label.hidden = false;
        }
      }
      drawActions(e.target);
    }
    function pointer(e: PointerEvent) {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        paintPointer(e);
      });
    }
    function click(e: MouseEvent) {
      if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();return;}
      multi.forEach(element=>element.removeAttribute('data-cms-selected'));multi.clear();
      if (!(e.target instanceof Element) || e.target.closest("[data-cms-chrome]")) return;
      const picked = editing ? pick(e.target, { x: e.clientX, y: e.clientY }) : null;
      if (picked) {
        e.preventDefault();
        e.stopImmediatePropagation();
        selected?.removeAttribute("data-cms-selected");
        const sentence = e.target.closest<HTMLElement>(
          "h1,h2,h3,h4,h5,h6,p,label,legend,figcaption,blockquote,dt,dd,th,td,address,a,button",
        );
        selected = sentence && describeDesignElement(sentence) ? sentence : picked.element;
        while (selected.tagName === "CMS-RUN" && selected.parentElement)
          selected = selected.parentElement;
        if (!describeDesignElement(selected)) selected = picked.element;
        selected.dataset["cmsSelected"] = "true";
        drag.sync();
        pause(true);
        send({
          type: "select",
          ids: picked.found.map((t) => t.id),
          design: describeDesignElement(selected),
        });
        return;
      }
      const recordOwner = e.target.closest<HTMLElement>("[data-cms-record]"),
        collectionOwner = e.target.closest<HTMLElement>("[data-cms-collection]");
      if (editing && recordOwner && collectionOwner) {
        e.preventDefault();
        e.stopImmediatePropagation();
        pause(true);
        send({
          type: "collection",
          kind: collectionOwner.dataset["cmsCollection"],
          record: recordOwner.dataset["cmsRecord"],
          mode: "list",
        });
        return;
      }
      if (editing) {
        const element = e.target.closest<HTMLElement>(
          "img,h1,h2,h3,h4,h5,h6,p,span,strong,em,small,button,a,section,article,figure,div,header,footer,main,aside,input,textarea,select,dl,dt,dd,td,th,li,form,fieldset,legend",
        );
        const descriptor = element ? describeDesignElement(element) : null;
        if (element && descriptor) {
          e.preventDefault();
          e.stopImmediatePropagation();
          selected?.removeAttribute("data-cms-selected");
          selected = element;
          selected.dataset["cmsSelected"] = "true";
          drag.sync();
          pause(true);
          send({ type: "select", ids: [], design: descriptor });
          return;
        }
      }
      const anchor = e.target.closest<HTMLAnchorElement>("a[href]");
      if (anchor) {
        const url = new URL(anchor.href, location.href);
        if (editing) {
          e.preventDefault();
          e.stopImmediatePropagation();
          send({ type: "hint", text: "Bağlantıyı açmak için üstten Önizleme moduna geçin." });
          return;
        }
        if (url.origin === location.origin && !url.pathname.startsWith("/admin")) {
          if (url.pathname === location.pathname && url.hash) {
            const anchorTarget = document.getElementById(decodeURIComponent(url.hash.slice(1)));
            if (anchorTarget) {
              e.preventDefault();
              e.stopImmediatePropagation();
              anchorTarget.scrollIntoView({ behavior: "smooth" });
              return;
            }
          }
          e.preventDefault();
          e.stopImmediatePropagation();
          window.dispatchEvent(
            new CustomEvent("scadawatt:cms-navigate", { detail: visualPath(url.href) }),
          );
        } else {
          e.preventDefault();
          e.stopImmediatePropagation();
          send({ type: "hint", text: "Dış bağlantılar yönetim önizlemesinde açılmaz." });
        }
      }
    }
    function doubleClick(e: MouseEvent) {
      if (!editing || !(e.target instanceof Element) || e.target.closest("[data-cms-chrome]"))
        return;
      const word = pickWord(e.target, e.clientX, e.clientY, getLanguage());
      if (!word) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      selected?.removeAttribute("data-cms-selected");
      selected = word.element;
      selected.dataset["cmsSelected"] = "true";
      pause(true);
      send({ type: "select", ids: [], design: word.descriptor });
    }
    function message(e: MessageEvent) {
      if (
        e.origin !== location.origin ||
        e.source !== window.parent ||
        e.data?.channel !== "scadawatt-visual"
      )
        return;
      const data = e.data;
      if (data.type === "configure" && Array.isArray(data.targets)) {
        targets = data.targets;
        if (data.content) applyEditorContent(data.content);
        if (data.design) {
          design = data.design;
          setCmsDesign(design);
        }
        const nextDevice = data.device === "mobile" ? "mobile" : "desktop";
        if (nextDevice !== device) {
          selected?.removeAttribute("data-cms-selected");
          selected = null;
          clearHover();
          pause(!previewActive);
        }
        device = nextDevice;
        wordMode = false;
        const address = new URL(location.href);
        address.searchParams.set("cms-device", device);
        history.replaceState(history.state, "", address);
        drag.sync();
        editing = data.editing !== false;
        if(data.content)setPreviewReview(data.content,!editing);
        document.documentElement.dataset["cmsEditing"] = String(editing);
        setLanguage(data.language === "en" ? "en" : "tr");
        if (!editing) {
          clearHover();
          selected?.removeAttribute("data-cms-selected");
          actions.hidden = true;
          pause(!previewActive);
        }
        if (typeof data.restoreY === "number") {
          requestAnimationFrame(() => window.scrollTo({ top: data.restoreY, behavior: "instant" }));
        }
        send({ type: "configured" });
      } else if (data.type === "navigate" && typeof data.path === "string") {
        const url = new URL(data.path, location.origin);
        if (url.origin === location.origin && !url.pathname.startsWith("/admin")) {
          selected?.removeAttribute("data-cms-selected");
          selected = null;
          clearHover();
          drag.sync();
          pause(false);
          window.dispatchEvent(
            new CustomEvent("scadawatt:cms-navigate", { detail: visualPath(url.href) }),
          );
        }
      } else if (data.type === "visibility") {
        previewActive = Boolean(data.active);
        pause(!previewActive || Boolean(editing && selected));
      } else if (data.type === "theme") {
        setFieldNight(Boolean(data.dark));
      } else if (data.type === "select-parent" && selected?.parentElement) {
        const parent = selected.parentElement,
          descriptor = describeDesignElement(parent);
        if (descriptor) {
          selected.removeAttribute("data-cms-selected");
          selected = parent;
          selected.dataset["cmsSelected"] = "true";
          drag.sync();
          send({ type: "select", ids: [], design: descriptor });
        }
      } else if (data.type === "scene" && Number.isInteger(data.stage)) {
        stage = data.stage;
        window.dispatchEvent(
          new CustomEvent("scadawatt:visual", { detail: { paused: true, stage } }),
        );
      } else if (data.type === "release") {
        pause(false);
        selected?.removeAttribute("data-cms-selected");
        selected = null;
        drag.sync();
      } else if (data.type === "focus" && typeof data.id === "string") {
        const id = data.id;
        const explicit = document.querySelector<HTMLElement>(
          '[data-cms-field="' + CSS.escape(id) + '"]',
        );
        explicit?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
    const controlPointer = (e: PointerEvent) => {
      if (
        editing &&
        e.target instanceof Element &&
        e.target.matches("input,textarea,select,button:disabled")
      ) {
        e.preventDefault();
        click(e);
      }
    };
    const submit = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      send({ type: "hint", text: "Formlar düzenleme önizlemesinde gönderilmez." });
    };
    const scroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        clearHover();
        actions.hidden = true;
        drag.sync();
        send({
          type: "position",
          y: scrollY,
          path: location.pathname + location.search + location.hash,
        });
      });
    };
    const route = () => {
      selected?.removeAttribute("data-cms-selected");
      selected = null;
      stage = undefined;
      clearHover();
      actions.hidden = true;
      drag.sync();
      send({ type: "ready", path: location.pathname + location.search + location.hash });
      send({
        type: "position",
        y: scrollY,
        path: location.pathname + location.search + location.hash,
      });
    };
    const scene = (e: Event) => {
      stage = (e as CustomEvent).detail.stage;
    };
    window.addEventListener("scadawatt:cms-route", route);
    window.addEventListener("message", message);
    document.addEventListener("pointermove", pointer, { passive: true });
    document.addEventListener("pointerdown", beginRange, true);
    document.addEventListener("pointermove", moveRange, true);
    document.addEventListener("pointerup", endRange, true);
    document.addEventListener("click", click, true);
    document.addEventListener("dblclick", doubleClick, true);
    document.addEventListener("pointerdown", controlPointer, true);
    document.addEventListener("submit", submit, true);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("scadawatt:visual-stage", scene);
    send({ type: "ready", path: location.pathname + location.search + location.hash });
    return () => {
      window.removeEventListener("scadawatt:cms-route", route);
      window.removeEventListener("message", message);
      document.removeEventListener("pointermove", pointer);
      document.removeEventListener("pointerdown", beginRange, true);
      document.removeEventListener("pointermove", moveRange, true);
      document.removeEventListener("pointerup", endRange, true);
      multi.forEach(element=>element.removeAttribute('data-cms-selected'));
      document.removeEventListener("click", click, true);
      document.removeEventListener("dblclick", doubleClick, true);
      document.removeEventListener("pointerdown", controlPointer, true);
      document.removeEventListener("submit", submit, true);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("scadawatt:visual-stage", scene);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pointerFrame);
      clearHover();
      selected?.removeAttribute("data-cms-selected");
      drag.dispose();
      root.remove();
      delete document.documentElement.dataset["cmsEditing"];
      pause(false);
    };
  }, []);
  return null;
}
