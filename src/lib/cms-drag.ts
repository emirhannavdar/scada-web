import { describeDesignElement, type SiteDesign } from "./cms-design";
export function boundMove(value: number, limit: number, min = -limit, max = limit) {
  const low = Math.max(-limit, min),
    high = Math.min(limit, max);
  return Math.max(
    low <= high ? low : -limit,
    Math.min(low <= high ? high : limit, Math.round(value / 4) * 4),
  );
}
export function installCmsDrag(
  root: HTMLElement,
  options: {
    selected: () => HTMLElement | null;
    editing: () => boolean;
    device: () => "desktop" | "mobile";
    design: () => SiteDesign;
    send: (value: Record<string, unknown>) => void;
  },
) {
  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "cms-move-handle";
  handle.textContent = "⠿ Tutup sürükle";
  handle.title =
    "Bu tutamacı basılı tutarak öğeyi taşıyın. Yön tuşlarıyla hassas ayar yapabilirsiniz.";
  handle.setAttribute("aria-label", "Seçili öğeyi sürükle");
  handle.hidden = true;
  root.append(handle);
  const style = document.createElement("style");
  style.textContent =
    ".cms-move-handle{position:fixed;z-index:2147483647;touch-action:none;user-select:none;cursor:grab;font:700 12px system-ui;border:2px solid #ef752d;background:#fff;color:#8f3510;padding:8px 12px;border-radius:7px;box-shadow:0 5px 20px #0003;pointer-events:auto!important}.cms-move-handle:active{cursor:grabbing;background:#fff0e7}.cms-move-handle:focus-visible{outline:3px solid #ffb780;outline-offset:3px}.cms-move-handle[hidden]{display:none}";
  root.append(style);
  let drag: {
      element: HTMLElement;
      descriptor: NonNullable<ReturnType<typeof describeDesignElement>>;
      pointer: number;
      startX: number;
      startY: number;
      x: number;
      y: number;
      dx: number;
      dy: number;
      limit: number;
      bounds: { left: number; right: number; top: number; bottom: number };
    } | null = null,
    temporary: HTMLElement | null = null,
    original = "",
    priority = "",
    frame = 0;
  function restore() {
    if (temporary) {
      if (original) temporary.style.setProperty("translate", original, priority);
      else temporary.style.removeProperty("translate");
      temporary = null;
    }
  }
  function position() {
    const element = options.selected(),
      descriptor = element ? describeDesignElement(element) : null;
    handle.hidden = !options.editing() || !descriptor || descriptor.locked;
    if (handle.hidden || !element) return;
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) {
      handle.hidden = true;
      return;
    }
    handle.style.left = Math.max(8, Math.min(innerWidth - 155, rect.right - 145)) + "px";
    handle.style.top = Math.max(8, Math.min(innerHeight - 38, rect.top - 36)) + "px";
  }
  function sync() {
    if (!drag) restore();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(position);
  }
  function begin(e: PointerEvent) {
    const element = options.selected(),
      descriptor = element ? describeDesignElement(element) : null;
    if (e.button !== 0 || !element || !descriptor || descriptor.locked || !options.editing())
      return;
    e.preventDefault();
    e.stopPropagation();
    const device = options.device(),
      entry = options.design().elements[descriptor.key],
      profile = `${device}${document.documentElement.dataset['theme']==='dark'?'Dark':'Light'}` as const,
      rules = {...entry?.[device], ...entry?.[profile]},
      x = rules.x ?? 0,
      y = rules.y ?? 0,
      rect = element.getBoundingClientRect(),
      parent = (
        element.closest("#main") ??
        element.closest("#root") ??
        element.parentElement
      )?.getBoundingClientRect(),
      limit = device === "mobile" ? 40 : 120;
    restore();
    temporary = element;
    original = element.style.getPropertyValue("translate");
    priority = element.style.getPropertyPriority("translate");
    drag = {
      element,
      descriptor,
      pointer: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x,
      y,
      dx: x,
      dy: y,
      limit,
      bounds: {
        left: parent && parent.width ? x + parent.left - rect.left : -limit,
        right: parent && parent.width ? x + parent.right - rect.right : limit,
        top: parent && parent.height ? y + parent.top - rect.top : -limit,
        bottom: parent && parent.height ? y + parent.bottom - rect.bottom : limit,
      },
    };
    handle.setPointerCapture?.(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return;
    e.preventDefault();
    const d = drag;
    d.dx = boundMove(d.x + e.clientX - d.startX, d.limit, d.bounds.left, d.bounds.right);
    d.dy = boundMove(d.y + e.clientY - d.startY, d.limit, d.bounds.top, d.bounds.bottom);
    d.element.style.setProperty("translate", d.dx + "px " + d.dy + "px", "important");
    position();
  }
  function finish(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return;
    const d = drag;
    drag = null;
    handle.releasePointerCapture?.(e.pointerId);
    if (d.dx === d.x && d.dy === d.y) {
      restore();
      return;
    }
    options.send({
      type: "move",
      key: d.descriptor.key,
      page: d.descriptor.page,
      selector: d.descriptor.selector,
      device: options.device(),
      x: d.dx,
      y: d.dy,
    });
  }
  function cancel() {
    if (!drag) return;
    drag = null;
    restore();
    position();
  }
  function key(e: KeyboardEvent) {
    if (e.key === "Escape") {
      cancel();
      return;
    }
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-4, 0],
      ArrowRight: [4, 0],
      ArrowUp: [0, -4],
      ArrowDown: [0, 4],
    };
    const delta = deltas[e.key],
      element = options.selected(),
      descriptor = element ? describeDesignElement(element) : null;
    if (!delta || !descriptor || descriptor.locked) return;
    e.preventDefault();
    const device = options.device(),
      rules = options.design().elements[descriptor.key]?.[device] ?? {},
      limit = device === "mobile" ? 40 : 120;
    options.send({
      type: "move",
      key: descriptor.key,
      page: descriptor.page,
      selector: descriptor.selector,
      device,
      x: boundMove((rules.x ?? 0) + delta[0], limit),
      y: boundMove((rules.y ?? 0) + delta[1], limit),
    });
  }
  handle.addEventListener("pointerdown", begin);
  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", finish);
  handle.addEventListener("pointercancel", cancel);
  handle.addEventListener("keydown", key);
  window.addEventListener("keydown", escape);
  function escape(e: KeyboardEvent) {
    if (e.key === "Escape") cancel();
  }
  return {
    sync,
    dispose() {
      cancelAnimationFrame(frame);
      restore();
      handle.remove();
      style.remove();
      window.removeEventListener("keydown", escape);
    },
  };
}
