import {PAGE_SECTIONS} from "./page-sections.mjs";
export const DESIGN_KEY = "@design";
export const HOME_SECTIONS = PAGE_SECTIONS["/"];
export const STYLE_BOUNDS = {
  fontSize: [8, 160],
  fontWeight: [100, 900],
  lineHeight: [0.8, 3],
  letterSpacing: [-4, 14],
  opacity: [0, 1],
  widthPercent: [20, 100],
  heightPx: [40, 1200],
  maxWidthPx: [160, 1600],
  borderRadius: [0, 64],
  paddingTop: [0, 240],
  paddingBottom: [0, 240],
  paddingInline: [0, 160],
  marginTop: [0, 160],
  marginBottom: [0, 160],
  x: [-120, 120],
  y: [-120, 120],
  order: [-8, 8],
  objectX: [0, 100],
  objectY: [0, 100],
};
export const STYLE_ENUMS = {
  textAlign: ["left", "center", "right", "justify"],
  alignSelf: ["auto", "start", "center", "end", "stretch"],
  justifySelf: ["auto", "start", "center", "end", "stretch"],
  objectFit: ["contain", "cover"],
  fontStyle: ["normal", "italic"],
  textDecoration: ["none", "underline", "line-through"],
  textTransform: ["none", "uppercase", "lowercase", "capitalize"],
  fontFamily: ["inherit", "Inter, sans-serif", "Journey Sora, sans-serif", "Journey Manrope, sans-serif", "Verdana, sans-serif", "Trebuchet MS, sans-serif", "Georgia, serif", "Palatino Linotype, serif", "Courier New, monospace", "monospace"],
  textShadow: ["none", "soft", "strong"],
  display: ["none"],
};
export const COLOR_KEYS = ["color", "backgroundColor", "borderColor"];
export const PALETTE_KEYS = ["accent", "text", "background", "surface", "muted"];
export function emptyDesign() {
  return {
    version: 1,
    palette: { light: {}, dark: {} },
    elements: {},
    homeOrder: [...HOME_SECTIONS],
    pageOrders: {},
  };
}
export function designKey(page, selector, fragment) {
  let hash = 14695981039346656037n;
  for (const char of page +
    "|" +
    selector +
    (fragment
      ? "|" + fragment.language + "|" + fragment.start + "|" + fragment.end + "|" + fragment.text
      : "")) {
    hash ^= BigInt(char.codePointAt(0));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return "el-" + hash.toString(16).padStart(16, "0");
}
const tags =
  "output|sup|sub|kbd|samp|s|u|i|q|picture|main|aside|summary|details|time|mark|code|pre|cite|abbr|caption|input|textarea|select|div|section|article|header|footer|figure|figcaption|h1|h2|h3|h4|h5|h6|p|span|em|strong|b|small|label|legend|blockquote|dt|dd|dl|th|td|tr|tbody|thead|table|ul|ol|li|address|a|button|img|nav|form|fieldset";
const token = new RegExp(
  "^(?:" +
    tags +
    ')(?:\\[data-cms-(?:section|collection|record|field)="[A-Za-z0-9_@./:-]{1,180}"\\])?(?::nth-of-type\\([1-9][0-9]{0,3}\\))?$',
);
export function safeSelector(selector) {
  if (typeof selector !== "string" || selector.length > 1200) return false;
  const parts = selector.split(" > ");
  return (
    ["#main", "#root"].includes(parts[0]) &&
    parts.length > 1 &&
    parts.length <= 24 &&
    parts.slice(1).every((p) => token.test(p))
  );
}
export function validateDesign(input) {
  const fail = (message) => {
      throw Object.assign(Error(message), { status: 400 });
    },
    object = (v) => v && typeof v === "object" && !Array.isArray(v),
    checkKeys = (v, keys) => {
      if (!object(v) || Object.keys(v).some((k) => !keys.includes(k)))
        fail("Geçersiz tasarım alanı.");
    },
    color = (value) => {
      if (typeof value !== "string" || !/^#[a-f0-9]{6}$/i.test(value))
        fail("Altı haneli HEX renk kullanın.");
      return value.toLowerCase();
    };
  checkKeys(input, ["version", "palette", "elements", "homeOrder", "pageOrders"]);
  if (input.version !== 1) fail("Tasarım sürümü geçersiz.");
  const out = emptyDesign();
  checkKeys(input.palette, ["light", "dark"]);
  for (const mode of ["light", "dark"]) {
    checkKeys(input.palette[mode], PALETTE_KEYS);
    for (const [key, value] of Object.entries(input.palette[mode]))
      out.palette[mode][key] = color(value);
  }
  if (
    !Array.isArray(input.homeOrder) ||
    ![4, HOME_SECTIONS.length].includes(input.homeOrder.length) ||
    new Set(input.homeOrder).size !== input.homeOrder.length ||
    input.homeOrder.some((id) => !HOME_SECTIONS.includes(id))
  )
    fail("Ana sayfa bölüm sırası geçersiz.");
  if (!["hardware","solutions","discovery","contact"].every(id=>input.homeOrder.includes(id))) fail("Ana sayfa bölümleri eksik.");
  out.homeOrder = [...input.homeOrder,...HOME_SECTIONS.filter(id=>!input.homeOrder.includes(id))];
  if (input.pageOrders !== undefined) {
    if (!object(input.pageOrders)) fail("Bölüm sırası geçersiz.");
    for (const [path,ids] of Object.entries(input.pageOrders)) {
      const allowed=PAGE_SECTIONS[path];
      if(path==="/" || !allowed || !Array.isArray(ids) || ids.length!==allowed.length || new Set(ids).size!==ids.length || ids.some(id=>!allowed.includes(id))) fail("Sayfa bölüm sırası geçersiz.");
      out.pageOrders[path]=[...ids];
    }
  }
  if (!object(input.elements) || Object.keys(input.elements).length > 600)
    fail("En fazla 600 öğenin tasarımı değiştirilebilir.");
  for (const [key, entry] of Object.entries(input.elements)) {
    checkKeys(entry, ["page", "selector", "label", "kind", "desktop", "mobile", "fragment", "desktopLight", "desktopDark", "mobileLight", "mobileDark"]);
    if (
      typeof entry.page !== "string" ||
      entry.page.length > 200 ||
      !/^\/(?:[a-z0-9-]+\/?)*$/.test(entry.page) ||
      /^\/(admin|api|uploads)(\/|$)/.test(entry.page) ||
      !safeSelector(entry.selector) ||
      key !== designKey(entry.page, entry.selector, entry.fragment)
    )
      fail("Geçersiz tasarım hedefi.");
    if (
      typeof entry.label !== "string" ||
      !entry.label.trim() ||
      entry.label.length > 160 ||
      !["text", "image", "block"].includes(entry.kind)
    )
      fail("Geçersiz tasarım etiketi.");
    const next = {
      page: entry.page,
      selector: entry.selector,
      label: entry.label,
      kind: entry.kind,
      desktop: {},
      mobile: {},
    };
    if (entry.fragment !== undefined) {
      const f = entry.fragment;
      checkKeys(f, ["start", "end", "text", "language"]);
      if (
        !Number.isSafeInteger(f.start) ||
        !Number.isSafeInteger(f.end) ||
        f.start < 0 ||
        f.end <= f.start ||
        f.end > 12000 ||
        typeof f.text !== "string" ||
        !f.text.trim() ||
        f.text.length > 160 ||
        f.end - f.start !== f.text.length ||
        !["tr", "en"].includes(f.language) ||
        entry.kind !== "text"
      )
        fail("Geçersiz kelime seçimi.");
      next.fragment = { ...f };
    }
    for (const mode of ["desktop", "mobile", "desktopLight", "desktopDark", "mobileLight", "mobileDark"]) {
      if (entry[mode] === undefined && mode !== "desktop" && mode !== "mobile") continue;
      next[mode] = {};
      checkKeys(entry[mode], [
        ...Object.keys(STYLE_BOUNDS),
        ...Object.keys(STYLE_ENUMS),
        ...COLOR_KEYS,
      ]);
      for (const [property, value] of Object.entries(entry[mode])) {
        if (STYLE_BOUNDS[property]) {
          let [min, max] = STYLE_BOUNDS[property];
          if (mode.startsWith("mobile")) {
            if (["x", "y"].includes(property)) {
              min = -40;
              max = 40;
            }
            if (property === "fontSize") max = 72;
          }
          if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)
            fail(property + " değeri izin verilen sınırların dışında.");
          next[mode][property] = value;
        } else if (STYLE_ENUMS[property]) {
          if (!STYLE_ENUMS[property].includes(value)) fail("Geçersiz hizalama/değer.");
          next[mode][property] = value;
        } else next[mode][property] = color(value);
      }
    }
    if (["desktop","mobile","desktopLight","desktopDark","mobileLight","mobileDark"].some(mode => Object.keys(next[mode] ?? {}).length))
      out.elements[key] = next;
  }
  return out;
}
