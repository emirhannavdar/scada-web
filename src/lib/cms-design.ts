import {shellReadability} from './shell-readability';
import { useSyncExternalStore } from "react";
import {
  emptyDesign,
  designKey,
  safeSelector,
  validateDesign,
  type SiteDesign,
  type DesignElement,
  type StyleRule,
  type WordFragment,
} from "../../shared/design.mjs";
export { emptyDesign, designKey, safeSelector, validateDesign };
export type { SiteDesign, DesignElement, StyleRule, WordFragment };
let design: SiteDesign = emptyDesign();
const listeners = new Set<() => void>();
export function setCmsDesign(next: SiteDesign | undefined) {
  design = next ? validateDesign(next) : emptyDesign();
  listeners.forEach((fn) => fn());
}
export function useCmsDesign() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => design,
    () => design,
  );
}
export type DesignSelection = {
  fragment?: WordFragment;
  key: string;
  page: string;
  selector: string;
  label: string;
  kind: "text" | "image" | "block";
  parentDisplay: string;
  locked: boolean;
  defaults: Record<string, string>;
  section?: string;
};
export function describeDesignElement(element: HTMLElement): DesignSelection | null {
  if (
    !element.closest("#root") ||
    element.closest("[data-cms-chrome],.cms-preview-banner,.flight-render,canvas,svg")
  )
    return null;
  const root = element.closest("#main") ?? element.closest("#root");
  if (!root || root === element) return null;
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== root) {
    const tag = node.tagName.toLowerCase();
    if (
      !/^(output|sup|sub|kbd|samp|s|u|i|q|picture|main|aside|summary|details|time|mark|code|pre|cite|abbr|caption|input|textarea|select|div|section|article|header|footer|figure|figcaption|h[1-6]|p|span|em|strong|b|small|label|legend|blockquote|dt|dd|dl|th|td|tr|tbody|thead|table|ul|ol|li|address|a|button|img|nav|form|fieldset)$/.test(
        tag,
      )
    )
      return null;
    const marker = ["record", "section", "field", "collection"].find((key) => {
      const value = node!.getAttribute("data-cms-" + key);
      return value && /^[A-Za-z0-9_@./:-]{1,180}$/.test(value);
    });
    if (marker) {
      parts.unshift(
        tag + "[data-cms-" + marker + '="' + node.getAttribute("data-cms-" + marker) + '"]',
      );
    } else {
      const siblings = Array.from(node.parentElement?.children ?? []).filter(
        (s) => s.tagName === node!.tagName,
      );
      parts.unshift(tag + ":nth-of-type(" + (siblings.indexOf(node) + 1) + ")");
    }
    node = node.parentElement;
  }
  const selector = "#" + root.id + " > " + parts.join(" > "),
    page = location.pathname.replace(/\/$/, "") || "/";
  if (!safeSelector(selector)) return null;
  const computed = getComputedStyle(element),
    kind =
      element.tagName === "IMG"
        ? "image"
        : /^(H[1-6]|P|SPAN|EM|STRONG|B|SMALL|LABEL|LEGEND|FIGCAPTION|BLOCKQUOTE|DT|DD|TH|TD|ADDRESS|A|BUTTON)$/.test(
              element.tagName,
            )
          ? "text"
          : "block";
  const defaults: Record<string, string> = {};
  for (const key of [
    "fontSize",
    "fontWeight",
    "fontStyle",
    "fontFamily",
    "textDecoration",
    "textTransform",
    "textShadow",
    "lineHeight",
    "letterSpacing",
    "opacity",
    "display",
    "color",
    "backgroundColor",
    "borderColor",
    "textAlign",
    "width",
    "height",
    "paddingTop",
    "paddingBottom",
    "marginTop",
    "marginBottom",
    "borderRadius",
    "alignSelf",
    "justifySelf",
    "order",
    "objectFit",
  ])
    defaults[key] = computed.getPropertyValue(key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()));
  const section = element.closest<HTMLElement>("[data-cms-section]")?.dataset["cmsSection"];
  return {
    key: designKey(page, selector),
    page,
    selector,
    label:
      (element.getAttribute("alt") || element.textContent || element.tagName)
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 100) || element.tagName,
    kind,
    parentDisplay: element.parentElement
      ? getComputedStyle(element.parentElement).display
      : "block",
    locked: Boolean(
      element.matches(
        ".data-voyage,.drone-sticky,.flight-render,.cinematic-home,.film-header,.film-navigation",
      ),
    ),
    defaults,
    ...(section ? { section } : {}),
  };
}
function rules(style: StyleRule) {
  const out: string[] = [];
  const direct = [
    "fontSize",
    "fontWeight",
    "fontStyle",
    "fontFamily",
    "textDecoration",
    "textTransform",
    "lineHeight",
    "letterSpacing",
    "opacity",
    "display",
    "borderRadius",
    "paddingTop",
    "paddingBottom",
    "paddingInline",
    "marginTop",
    "marginBottom",
    "textAlign",
    "alignSelf",
    "justifySelf",
    "order",
    "objectFit",
    "color",
    "backgroundColor",
    "borderColor",
  ] as const;
  for (const key of direct) {
    const value = style[key];
    if (value === undefined) continue;
    const name = key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()),
      unit =
        typeof value === "number" && !["fontWeight", "lineHeight", "opacity", "order"].includes(key)
          ? "px"
          : "";
    out.push(name + ":" + value + unit + "!important");
  }
  if (style.textShadow !== undefined)
    out.push(
      "text-shadow:" +
        (style.textShadow === "soft"
          ? "0 2px 12px #0004"
          : style.textShadow === "strong"
            ? "0 3px 18px #0009"
            : "none") +
        "!important",
    );
  if (style.widthPercent !== undefined)
    out.push("width:" + style.widthPercent + "%!important", "max-width:100%!important");
  if (style.heightPx !== undefined) out.push("height:" + style.heightPx + "px!important");
  if (style.maxWidthPx !== undefined)
    out.push("max-width:min(100%," + style.maxWidthPx + "px)!important");
  if (style.x !== undefined || style.y !== undefined)
    out.push("translate:" + (style.x ?? 0) + "px " + (style.y ?? 0) + "px!important");
  if (style.objectX !== undefined || style.objectY !== undefined)
    out.push(
      "object-position:" + (style.objectX ?? 50) + "% " + (style.objectY ?? 50) + "%!important",
    );
  return out.join(";");
}
export function designCss(input: SiteDesign, path: string) {
  const css: string[] = [];
  const page = path.replace(/\/$/, "") || "/";
  for (const entry of Object.values(input.elements)) {
    if (entry.fragment || entry.page !== page || !safeSelector(entry.selector)) continue;
    const desktop = rules(shellReadability(entry.desktop,entry.selector)),
      mobile = rules(shellReadability(entry.mobile,entry.selector));
    for (const device of ["desktop", "mobile"] as const) {
      for (const theme of ["Light", "Dark"] as const) {
        const profile = `${device}${theme}` as const;
        const scoped = rules(shellReadability(entry[profile] ?? {},entry.selector));
        if (scoped) css.push(`@media(${device === "mobile" ? "max-width:760px" : "min-width:761px"}){html${theme === "Dark" ? '[data-theme="dark"]' : ':not([data-theme="dark"])'} ${entry.selector.startsWith("#main") ? "#root " : ""}${entry.selector}{${scoped}}}`);
      }
    }
    if (desktop)
      css.push(
        "@media(min-width:761px){" +
          (entry.selector.startsWith("#main") ? "#root " + entry.selector : entry.selector) +
          "{" +
          desktop +
          "}}",
      );
    if (mobile)
      css.push(
        "@media(max-width:760px){" +
          (entry.selector.startsWith("#main") ? "#root " + entry.selector : entry.selector) +
          "{" +
          mobile +
          "}}",
      );
  }
  const mappings: Record<string, string[]> = {
    accent: ["--signal", "--primary", "--ring"],
    text: ["--foreground", "--card-foreground", "--film-ink"],
    background: ["--background", "--film-paper"],
    surface: ["--card", "--paper-2", "--secondary"],
    muted: ["--muted-foreground", "--film-muted"],
  };
  for (const mode of ["light", "dark"] as const) {
    const palette = input.palette[mode],
      scope = mode === "dark" ? 'html[data-theme="dark"]' : 'html:not([data-theme="dark"])';
    const vars = Object.entries(palette).flatMap(([key, color]) =>
      (mappings[key] ?? []).map((token) => token + ":" + color + "!important"),
    );
    if (vars.length) css.push(scope + "{" + vars.join(";") + "}");
    if (palette["background"])
      css.push(
        scope +
          " body," +
          scope +
          " #main," +
          scope +
          " :is(.solution-editorial,.final-connection,.film-footer,.corporate-footer,.company-page){background-color:" +
          palette["background"] +
          "!important}",
      );
    if (palette["surface"])
      css.push(
        scope +
          " :is(.product-experience,.software-apps,.page-editorial,.discovery-section,.hardware-preview,.hardware-index,.about-pillars article,.request-form){background-color:" +
          palette["surface"] +
          "!important}",
      );
    if (palette["text"])
      css.push(
        scope +
          " #main :is(h1,h2,h3,h4,h5,h6,p,blockquote,li,dt,dd,label,legend,td,th):not(.data-voyage *){color:" +
          palette["text"] +
          "!important}",
      );
    if (palette["muted"])
      css.push(
        scope +
          " #main :is(.film-label,.sw-kicker,.company-kicker,.request-help,.discovery-muted){color:" +
          palette["muted"] +
          "!important}",
      );
    if (palette["accent"])
      css.push(
        scope +
          " :is(.request-submit,.discovery-primary,.advisor-check,.film-label>span){background-color:" +
          palette["accent"] +
          "!important}",
      );
  }
  return css.join("\n");
}
