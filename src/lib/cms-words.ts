import {shellReadability} from './shell-readability';
import {
  describeDesignElement,
  designKey,
  type DesignSelection,
  type SiteDesign,
  type StyleRule,
  type WordFragment,
} from "./cms-design";
const blocks =
  "h1,h2,h3,h4,h5,h6,p,li,td,th,label,button,figcaption,blockquote,dt,dd,legend,address";
export function wordAtOffset(text: string, offset: number) {
  const words = [...text.matchAll(/[\p{L}\p{N}_]+(?:['’’-][\p{L}\p{N}_]+)*/gu)];
  const word =
    words.find((w) => offset >= w.index! && offset < w.index! + w[0].length) ??
    words.find((w) => offset === w.index! + w[0].length);
  return word ? { start: word.index!, end: word.index! + word[0].length, text: word[0] } : null;
}
export function describeWord(element: HTMLElement, fragment: WordFragment): DesignSelection | null {
  const base = describeDesignElement(element);
  if (!base || element.textContent?.slice(fragment.start, fragment.end) !== fragment.text)
    return null;
  return {
    ...base,
    key: designKey(base.page, base.selector, fragment),
    kind: "text",
    fragment,
    label: "“" + fragment.text + "” · " + fragment.language.toUpperCase(),
    locked: true,
  };
}
export function pickWord(target: Element, x: number, y: number, language: "tr" | "en") {
  const element = target.closest<HTMLElement>(blocks) ?? target.closest<HTMLElement>("a");
  if (!element) return null;
  let range: Range | null = null;
  const selected = getSelection();
  if (selected && !selected.isCollapsed && selected.rangeCount) {
    const current = selected.getRangeAt(0);
    if (
      element.contains(current.commonAncestorContainer) &&
      current.toString().trim() &&
      current.toString().length <= 160
    )
      range = current.cloneRange();
  }
  if (!range) {
    const doc = document as Document & {
      caretPositionFromPoint?: (
        x: number,
        y: number,
      ) => { offsetNode: Node; offset: number } | null;
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
    };
    const caret = doc.caretPositionFromPoint?.(x, y);
    if (caret) {
      range = document.createRange();
      range.setStart(caret.offsetNode, caret.offset);
      range.collapse(true);
    } else range = doc.caretRangeFromPoint?.(x, y) ?? null;
  }
  if (!range || !element.contains(range.startContainer)) return null;
  const prefix = document.createRange();
  prefix.selectNodeContents(element);
  prefix.setEnd(range.startContainer, range.startOffset);
  const start = prefix.toString().length;
  let fragment = range.collapsed
    ? wordAtOffset(element.textContent ?? "", start)
    : { start, end: start + range.toString().length, text: range.toString() };
  if (range.collapsed && range.startContainer instanceof Text) {
    const local = wordAtOffset(range.startContainer.data, range.startOffset);
    prefix.setEnd(range.startContainer, 0);
    const before = prefix.toString().length;
    fragment = local
      ? { start: before + local.start, end: before + local.end, text: local.text }
      : null;
  }
  const descriptor = fragment ? describeWord(element, { ...fragment, language }) : null;
  return descriptor ? { element, descriptor } : null;
}
const allowed = [
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontFamily",
  "textDecoration",
  "textTransform",
  "lineHeight",
  "letterSpacing",
  "opacity",
  "color",
  "backgroundColor",
] as const;
function applyRule(element: HTMLElement, rule: StyleRule, context?: HTMLElement) {
  rule=shellReadability(rule,'',context??element);
  for (const key of allowed) {
    const value = rule[key];
    if (value === undefined) continue;
    const unit =
      typeof value === "number" && !["fontWeight", "lineHeight", "opacity"].includes(key)
        ? "px"
        : "";
    element.style.setProperty(
      key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()),
      value + unit,
      "important",
    );
  }
  if (rule.textShadow !== undefined)
    element.style.setProperty(
      "text-shadow",
      rule.textShadow === "soft"
        ? "0 2px 12px #0004"
        : rule.textShadow === "strong"
          ? "0 3px 18px #0009"
          : "none",
      "important",
    );
}
type RecordNode = { node: Text; parent: Node; source: string; runs: HTMLElement[] };
/** Keep React's original Text nodes attached. Generated runs never replace React-owned nodes. */
export function installWordStyles(
  design: SiteDesign,
  page: string,
  device: "desktop" | "mobile",
  language: "tr" | "en",
) {
  const entries = Object.values(design.elements).filter(
    (e) =>
      e.fragment &&
      e.page === (page.replace(/\/$/, "") || "/") &&
      e.fragment.language === language &&
      [device,`${device}Light`,`${device}Dark`].some(profile=>Object.keys((e as unknown as Record<string,object>)[profile]??{}).length),
  );
  if (!entries.length) return () => {};
  const themedRule = (entry: (typeof entries)[number]):StyleRule => ({...entry[device],...entry[`${device}${document.documentElement.dataset['theme']==='dark'?'Dark':'Light'}` as const]});
  let records: RecordNode[] = [],
    owners: HTMLElement[] = [],
    frame = 0,
    stopped = false;
  const edited = new Set<Text>();
  const observer = new MutationObserver((mutations) => {
    let relevant = false;
    for (const m of mutations) {
      const target = m.target instanceof Element ? m.target : m.target.parentElement;
      if (target?.closest("[data-cms-chrome],.flight-render,style,script")) continue;
      if (
        owners.length &&
        !owners.some(
          (owner) =>
            owner.contains(m.target) || (m.type === "childList" && m.target.contains(owner)),
        )
      )
        continue;
      if (m.type === "characterData" && m.target instanceof Text) edited.add(m.target);
      relevant = true;
    }
    if (relevant && !frame)
      frame = requestAnimationFrame(() => {
        frame = 0;
        render();
      });
  });
  function restore() {
    for (const record of records) {
      if (record.node.parentNode === record.parent) {
        const source =
          edited.has(record.node) || record.node.data !== "" ? record.node.data : record.source;
        record.node.data = source;
      }
      record.runs.forEach((run) => run.remove());
    }
    records = [];
    edited.clear();
  }
  function render() {
    if (stopped) return;
    observer.disconnect();
    restore();
    const grouped = new Map<HTMLElement, typeof entries>();
    for (const entry of entries) {
      const element = document.querySelector<HTMLElement>(entry.selector);
      if (!element) continue;
      const group = grouped.get(element) ?? [];
      group.push(entry);
      grouped.set(element, group);
    }
    owners = [...grouped.keys()];
    // Process deepest targets first so nested typographic elements remain independently editable.
    for (const [element, group] of [...grouped].sort(([a], [b]) =>
      a.contains(b) ? 1 : b.contains(a) ? -1 : 0,
    )) {
      const text = element.textContent ?? "",
        valid = group.filter(
          (e) => text.slice(e.fragment!.start, e.fragment!.end) === e.fragment!.text,
        );
      if (!valid.length) continue;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT),
        nodes: Text[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (!node.parentElement?.closest("script,style,[data-cms-chrome]")) nodes.push(node);
      }
      let offset = 0;
      for (const node of nodes) {
        const source = node.data,
          start = offset;
        offset += source.length;
        const relevant = valid.filter((e) => e.fragment!.start < offset && e.fragment!.end > start);
        if (!relevant.length || !node.parentNode) continue;
        const existing = node.parentElement?.closest<HTMLElement>("cms-run");
        if (existing) {
          for (const entry of relevant)
            if (entry.fragment!.start <= start && entry.fragment!.end >= offset)
              applyRule(existing, themedRule(entry), element);
          continue;
        }
        const cuts = [
            ...new Set([
              0,
              source.length,
              ...relevant.flatMap((e) => [
                Math.max(0, e.fragment!.start - start),
                Math.min(source.length, e.fragment!.end - start),
              ]),
            ]),
          ].sort((a, b) => a - b),
          record: RecordNode = { node, parent: node.parentNode, source, runs: [] };
        for (let i = 0; i < cuts.length - 1; i++) {
          const a = cuts[i]!,
            b = cuts[i + 1]!;
          if (a === b) continue;
          const run = document.createElement("cms-run");
          run.dataset["cmsWord"] = "true";
          run.textContent = source.slice(a, b);
          for (const entry of relevant)
            if (entry.fragment!.start <= start + a && entry.fragment!.end >= start + b)
              applyRule(run, themedRule(entry), element);
          record.runs.push(run);
        }
        node.data = "";
        const outer = document.createElement("cms-run");
        outer.dataset["cmsWord"] = "true";
        record.runs.forEach((run) => outer.append(run));
        record.runs = [outer];
        record.parent.insertBefore(outer, node.nextSibling);
        records.push(record);
      }
    }
    observer.observe(document.getElementById("root") ?? document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }
  const themeObserver=new MutationObserver(()=>{if(!stopped)render()});
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  render();
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    themeObserver.disconnect();
    restore();
  };
}
