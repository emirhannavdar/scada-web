import {PAGE_SECTIONS,sectionOrder} from '../../../shared/page-sections.mjs';
import "./design-editor.css";
import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CornerLeftUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { STYLE_BOUNDS, STYLE_ENUMS, HOME_SECTIONS } from "../../../shared/design.mjs";
import {
  emptyDesign,
  type SiteDesign,
  type StyleRule,
  type DesignSelection,
} from "@/lib/cms-design";
import { sectionNames, styleNames } from "@/lib/cms-design-labels";
const optionNames: Record<string, string> = {
  normal: "Normal",
  italic: "İtalik",
  none: "Yok",
  underline: "Altı çizili",
  "line-through": "Üstü çizili",
  uppercase: "BÜYÜK HARF",
  lowercase: "küçük harf",
  capitalize: "Baş Harfler",
  inherit: "Sitenin yazı tipi",
  "Inter, sans-serif": "Inter / Modern",
  "Georgia, serif": "Georgia / Klasik",
  "Journey Sora, sans-serif": "Sora / Geometrik",
  "Journey Manrope, sans-serif": "Manrope / Çağdaş",
  "Verdana, sans-serif": "Verdana / Okunaklı",
  "Trebuchet MS, sans-serif": "Trebuchet / Dinamik",
  "Palatino Linotype, serif": "Palatino / Editoryal",
  "Courier New, monospace": "Courier / Kod",
  monospace: "Mono / Teknik",
  soft: "Yumuşak",
  strong: "Belirgin",
  left: "Sol",
  right: "Sağ",
  center: "Orta",
  justify: "İki yana",
  auto: "Otomatik",
  start: "Başlangıç",
  end: "Bitiş",
  stretch: "Alanı doldur",
  contain: "Tamamını göster",
  cover: "Alanı kapla",
};
const quickColors = [
  "#20332e",
  "#ffffff",
  "#e9783b",
  "#236bca",
  "#318364",
  "#d83b3b",
  "#0d1516",
  "#f4f5ed",
];
const base: Record<"light" | "dark", Record<string, string>> = {
  light: {
    accent: "#e9783b",
    text: "#20332e",
    background: "#e8e9df",
    surface: "#f4f5ed",
    muted: "#6b8074",
  },
  dark: {
    accent: "#ffab73",
    text: "#e3eae5",
    background: "#0d1516",
    surface: "#172323",
    muted: "#a4b6ad",
  },
};
const presets = [
  { name: "ScadaWatt Turuncu", accent: ["#e9783b", "#ffab73"] },
  { name: "Teknoloji Mavisi", accent: ["#236bca", "#80b8ff"] },
  { name: "Orman Yeşili", accent: ["#318364", "#81d1ad"] },
];
function hex(value: string | undefined, fallback: string) {
  if (value && /^#[0-9a-f]{6}$/i.test(value)) return value;
  const rgb = value?.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);
  return rgb
    ? "#" +
        rgb
          .slice(1, 4)
          .map((v) => Number(v).toString(16).padStart(2, "0"))
          .join("")
    : fallback;
}
export function DesignEditor({
  design = emptyDesign(),
  path = "/",
  selected,
  selections,
  onChange,
  onParent,
  onTheme,
  theme,
  device = "desktop",
}: {
  design?: SiteDesign;
  path?: string;
  selected: DesignSelection | null;
  selections?: DesignSelection[];
  onChange: (value: SiteDesign) => void;
  onParent: () => void;
  onTheme: (dark: boolean) => void;
  theme: "light" | "dark";
  device?: "desktop" | "mobile";
}) {
  const [tab, setTab] = useState<"element" | "palette" | "sections">("element");
  const entry = selected ? design.elements[selected.key] : undefined,
    profile = `${device}${theme === "dark" ? "Dark" : "Light"}` as const,
    rules: StyleRule = { ...entry?.[device], ...entry?.[profile] };
  function setRule(key: keyof StyleRule, value: string | number | undefined) {
    if (!selected) return;
    const next = structuredClone(design);
    for (const target of selections?.length ? selections : [selected]) {
      const item = next.elements[target.key] ?? {
        page: target.page,
        selector: target.selector,
        label: target.label,
        kind: target.kind,
        ...(target.fragment ? { fragment: target.fragment } : {}),
        desktop: {},
        mobile: {},
      };
    const scoped = item[profile] ??= {};
    if (value === undefined) delete scoped[key];
    else (scoped as Record<string, unknown>)[key] = value;
    if (!["desktop","mobile","desktopLight","desktopDark","mobileLight","mobileDark"].some(p => Object.keys((item as unknown as Record<string,object>)[p] ?? {}).length))
      delete next.elements[target.key];
    else next.elements[target.key] = item;
    }
    onChange(next);
  }
  function applyTypePreset(font: string, weight: number, spacing: number) {
    if(!selected) return;
    const next=structuredClone(design);
    for(const target of selections?.length ? selections : [selected]) {
      const item=next.elements[target.key] ?? {page:target.page,selector:target.selector,label:target.label,kind:target.kind,...(target.fragment?{fragment:target.fragment}:{}),desktop:{},mobile:{}};
      item[profile]={...item[profile],fontFamily:font,fontWeight:weight,letterSpacing:spacing,lineHeight:1.3};
      next.elements[target.key]=item;
    }
    onChange(next);
  }
  function numeric(key: keyof StyleRule, fallback = 0) {
    let [min, max] = STYLE_BOUNDS[key]!;
    if (device === "mobile") {
      if (key === "fontSize") max = 72;
      if (key === "x" || key === "y") {
        min = -40;
        max = 40;
      }
    }
    const raw = rules[key],
      computed = selected?.defaults[key],
      defaultValue =
        typeof raw === "number"
          ? raw
          : Math.max(
              min,
              Math.min(
                max,
                (key === "lineHeight" && computed?.endsWith("px")
                  ? Number.parseFloat(computed) /
                    Number.parseFloat(selected?.defaults["fontSize"] || "16")
                  : Number.parseFloat(computed || "")) || fallback,
              ),
            ),
      step = key === "lineHeight" ? 0.05 : key === "letterSpacing" ? 0.1 : 1;
    return (
      <label className="design-control" key={key}>
        <span>
          {styleNames[key]}
          <button
            type="button"
            aria-label={styleNames[key] + " sıfırla"}
            disabled={raw === undefined}
            onClick={() => setRule(key, undefined)}
          >
            <RotateCcw size={12} />
          </button>
        </span>
        <div>
          <input
            aria-label={styleNames[key]}
            type="range"
            min={min}
            max={max}
            step={step}
            value={defaultValue}
            onChange={(e) => setRule(key, Number(e.target.value))}
          />
          <input
            aria-label={styleNames[key] + " değeri"}
            type="number"
            min={min}
            max={max}
            step={step}
            value={defaultValue}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) setRule(key, Math.min(max, Math.max(min, v)));
            }}
          />
        </div>
      </label>
    );
  }
  function select(key: keyof StyleRule) {
    return (
      <label className="design-control" key={key}>
        <span>
          {styleNames[key]}
          <button
            type="button"
            disabled={rules[key] === undefined}
            aria-label={styleNames[key] + " sıfırla"}
            onClick={() => setRule(key, undefined)}
          >
            <RotateCcw size={12} />
          </button>
        </span>
        <select
          aria-label={styleNames[key]}
          value={String(rules[key] ?? "")}
          onChange={(e) => setRule(key, e.target.value || undefined)}
        >
          <option value="">Mevcut tasarım</option>
          {STYLE_ENUMS[key]!.map((value) => (
            <option key={value} value={value}>
              {optionNames[value] || value}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function color(key: keyof StyleRule) {
    const value = hex(String(rules[key] ?? selected?.defaults[key] ?? ""), "#20332e");
    return (
      <label className="design-control design-color" key={key}>
        <span>
          {styleNames[key]}
          <button
            type="button"
            disabled={rules[key] === undefined}
            aria-label={styleNames[key] + " sıfırla"}
            onClick={() => setRule(key, undefined)}
          >
            <RotateCcw size={12} />
          </button>
        </span>
        <div>
          <input
            aria-label={styleNames[key]}
            type="color"
            value={value}
            onChange={(e) => setRule(key, e.target.value)}
          />
          <input
            aria-label={styleNames[key] + " HEX"}
            value={value}
            maxLength={7}
            onChange={(e) => {
              if (/^#[0-9a-f]{6}$/i.test(e.target.value)) setRule(key, e.target.value);
            }}
          />
        </div>
        <div className="design-color-swatches">
          {quickColors.map((c) => (
            <button
              type="button"
              key={c}
              aria-label={styleNames[key] + " " + c}
              style={{ background: c }}
              onClick={() => setRule(key, c)}
            />
          ))}
        </div>
      </label>
    );
  }
  const page=path.replace(/\/$/,"")||"/",order=sectionOrder(design,page);
  function setOrder(ids:string[]){onChange(page==='/'?{...design,homeOrder:ids}:{...design,pageOrders:{...design.pageOrders,[page]:ids}})}
  function move(index: number, direction: number) {
    const homeOrder = [...order];
    [homeOrder[index], homeOrder[index + direction]] = [
      homeOrder[index + direction]!,
      homeOrder[index]!,
    ];
    setOrder(homeOrder);
  }
  return (
    <section className="design-editor">
      <div className="design-themes" role="group" aria-label="Düzenlenecek tema">
        <button type="button" aria-pressed={theme === "light"} onClick={() => onTheme(false)}>Aydınlık tema</button>
        <button type="button" aria-pressed={theme === "dark"} onClick={() => onTheme(true)}>Karanlık tema</button>
      </div>
      <p className="visual-help">{selections?.length ? `${selections.length} metin seçili. Değişiklikler tümüne uygulanır. ` : ""}{device === "mobile" ? "Mobil" : "Masaüstü"} · {theme === "dark" ? "Karanlık" : "Aydınlık"} tema düzenleniyor. Diğer tema korunur.</p>
      <div className="design-tabs" role="group" aria-label="Tasarım alanı">
        {(
          [
            ["element", "Seçilen öğe"],
            ["palette", "Renk paleti"],
            ["sections", "Bölüm sırası"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "element" &&
        (!selected ? (
          <p className="visual-help">
            Sayfada bir yazı, görsel veya bölüm seçin. Boyut, renk ve yerleşim ayarları burada
            açılır.
          </p>
        ) : (
          <>
            <div className="design-selection">
              <strong>{selected.label}</strong>
              <small>
                {selected.page} ·{" "}
                {selected.kind === "image"
                  ? "Görsel"
                  : selected.kind === "text"
                    ? "Metin"
                    : "Bölüm / kapsayıcı"}
              </small>
              <button onClick={onParent}>
                <CornerLeftUp size={14} />
                Üst kapsayıcıyı seç
              </button>
            </div>
            <p className="design-device-badge">
              {device === "mobile" ? "MOBİL" : "MASAÜSTÜ"} · Ayrı içerik ve tasarım
            </p>
            <p className="visual-help">
              Ayarlar yalnız bu görünüm için kaydedilir. Diğer görünüme geçmek için üstteki cihaz
              düğmesini kullanın.
            </p>
            {selected.kind === "text" && (
              <fieldset>
                <legend>Yazı · Tipografi stilleri</legend>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <button type="button" onClick={()=>applyTypePreset('Journey Sora, sans-serif',600,-0.6)} style={{fontFamily:'Journey Sora',padding:12}}>Sora · Güçlü başlık</button>
                  <button type="button" onClick={()=>applyTypePreset('Journey Manrope, sans-serif',500,0)} style={{fontFamily:'Journey Manrope',padding:12}}>Manrope · Zarif</button>
                  <button type="button" onClick={()=>applyTypePreset('Georgia, serif',400,0)} style={{fontFamily:'Georgia',padding:12}}>Editoryal</button>
                  <button type="button" onClick={()=>applyTypePreset('monospace',500,0.4)} style={{fontFamily:'monospace',padding:12}}>Teknik</button>
                </div>
                {numeric("fontSize", 16)}
                <p className="visual-help">Tipografi · Sora, Manrope ve klasik yazı tipleri</p>{select("fontFamily")}
                {!selected.fragment && select("textAlign")}
                {select("fontStyle")}
                {select("textDecoration")}
                {select("textTransform")}
                {select("textShadow")}
                {numeric("fontWeight", 400)}
                {numeric("lineHeight", 1.4)}
                {numeric("letterSpacing", 0)}
                {numeric("opacity", 1)}
              </fieldset>
            )}
            <fieldset>
              <legend>Renkler</legend>
              {color("color")}
              {color("backgroundColor")}
              {!selected.fragment && color("borderColor")}
            </fieldset>
            {!selected.locked && (
              <>
                <fieldset>
                  <legend>Boyut ve boşluk</legend>
                  {numeric("widthPercent", 100)}
                  {numeric("heightPx", 300)}
                  {numeric("maxWidthPx", 900)}
                  {numeric("borderRadius", 0)}
                  {numeric("paddingTop", 0)}
                  {numeric("paddingBottom", 0)}
                  {numeric("paddingInline", 0)}
                  {numeric("marginTop", 0)}
                  {numeric("marginBottom", 0)}
                </fieldset>
                <fieldset>
                  <legend>Sayfadaki konum</legend>
                  <div className="design-arrows">
                    <button
                      aria-label="Sola kaydır"
                      onClick={() =>
                        setRule("x", Math.max(device === "mobile" ? -40 : -120, (rules.x ?? 0) - 8))
                      }
                    >
                      <ArrowLeft size={15} />
                    </button>
                    <button
                      aria-label="Sağa kaydır"
                      onClick={() =>
                        setRule("x", Math.min(device === "mobile" ? 40 : 120, (rules.x ?? 0) + 8))
                      }
                    >
                      <ArrowRight size={15} />
                    </button>
                    <button
                      aria-label="Yukarı kaydır"
                      onClick={() =>
                        setRule("y", Math.max(device === "mobile" ? -40 : -120, (rules.y ?? 0) - 8))
                      }
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      aria-label="Aşağı kaydır"
                      onClick={() =>
                        setRule("y", Math.min(device === "mobile" ? 40 : 120, (rules.y ?? 0) + 8))
                      }
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                  {numeric("x", 0)}
                  {numeric("y", 0)}
                  {select("alignSelf")}
                  {select("justifySelf")}
                  {/flex|grid/.test(selected.parentDisplay) ? (
                    numeric("order", 0)
                  ) : (
                    <p className="visual-help">
                      Bu kapsayıcı sabit akıştadır. Hizalama ve kaydırma kullanabilirsiniz. Ana
                      sayfa bölümlerini Bölüm sırası sekmesinden taşıyın.
                    </p>
                  )}
                </fieldset>
              </>
            )}
            {selected.locked && (
              <p className="visual-help">
                {selected.fragment
                  ? "Kelime biçimi seçili. Konum için Öğe seç modunda metnin tamamını seçin."
                  : "Bu kapsayıcının geometrisi sabittir. İçindeki yazı veya görseli seçerek düzenleyebilirsiniz."}
              </p>
            )}
            {selected.kind === "image" && (
              <fieldset>
                <legend>Görsel ve kırpma</legend>
                {select("objectFit")}
                {numeric("objectX", 50)}
                {numeric("objectY", 50)}
              </fieldset>
            )}
            {!selected.fragment && (
              <button
                className="design-hide"
                onClick={() => setRule("display", rules.display === "none" ? undefined : "none")}
              >
                {rules.display === "none" ? <Eye size={14} /> : <EyeOff size={14} />}{" "}
                {rules.display === "none" ? "Alanı yeniden göster" : "Bu alanı tamamen gizle"}
              </button>
            )}
            <button
              className="design-reset"
              disabled={!entry}
              onClick={() => {
                const next = structuredClone(design);
                for(const target of selections?.length?selections:[selected]){
                  const item=next.elements[target.key];if(item)delete item[profile];
                }
                onChange(next);
              }}
            >
              <RotateCcw size={14} />
              Seçili temanın ayarlarını sıfırla
            </button>
          </>
        ))}
      {tab === "palette" && (
        <>
          <h3>Site renkleri</h3>
          <div className="design-devices" role="group" aria-label="Palet teması">
            <button aria-pressed={theme === "light"} onClick={() => onTheme(false)}>
              Gündüz / Aydınlık
            </button>
            <button aria-pressed={theme === "dark"} onClick={() => onTheme(true)}>
              Gece / Koyu
            </button>
          </div>
          <p className="visual-help">
            Seçilen temanın 2D sayfa renkleri değişir. 3D sahnenin ışıkları bu ayarlardan
            bağımsızdır.
          </p>
          <div className="design-presets">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() =>
                  onChange({
                    ...design,
                    palette: {
                      ...design.palette,
                      [theme]: { ...base[theme], accent: p.accent[theme === "light" ? 0 : 1]! },
                    },
                  })
                }
              >
                <i style={{ background: p.accent[theme === "light" ? 0 : 1] }} />
                {p.name}
              </button>
            ))}
          </div>
          {Object.entries({
            accent: "Vurgu rengi",
            text: "Ana metin",
            background: "Sayfa zemini",
            surface: "Kart / yüzey",
            muted: "İkincil metin",
          }).map(([key, label]) => (
            <label className="design-control" key={key}>
              <span>
                {label}
                <button
                  aria-label={label + " palet rengini sıfırla"}
                  disabled={!design.palette[theme][key]}
                  onClick={() => {
                    const next = structuredClone(design);
                    delete next.palette[theme][key];
                    onChange(next);
                  }}
                >
                  <RotateCcw size={12} />
                </button>
              </span>
              <div>
                <input
                  aria-label={label}
                  type="color"
                  value={design.palette[theme][key] ?? base[theme][key]}
                  onChange={(e) =>
                    onChange({
                      ...design,
                      palette: {
                        ...design.palette,
                        [theme]: { ...design.palette[theme], [key]: e.target.value },
                      },
                    })
                  }
                />
                <code>{design.palette[theme][key] ?? "Mevcut tasarım"}</code>
              </div>
            </label>
          ))}
          <button
            onClick={() => onChange({ ...design, palette: { ...design.palette, [theme]: {} } })}
          >
            <RotateCcw size={14} />
            Bu temanın paletini sıfırla
          </button>
        </>
      )}
      {tab === "sections" && (
        <>
          <h3>Bu sayfanın bölüm sırası</h3>
          <p className="visual-help">
            Başlangıç başlığı / 3D yolculuk sabittir. SSS ve yorumlar dahil bölümleri oklarla taşıyın. Kapalı bölümler ziyaretçiye gösterilmez. Masaüstü ve mobil sıraları ayrıdır.
          </p>
          <ol className="design-sections">
            {order.map((id, index) => (
              <li key={id}>
                <span>
                  {index + 1}. {sectionNames[id] || id}
                </span>
                <button
                  aria-label={sectionNames[id] + " yukarı taşı"}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  aria-label={sectionNames[id] + " aşağı taşı"}
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={14} />
                </button>
              </li>
            ))}
          </ol>
          <button onClick={() => setOrder([...(PAGE_SECTIONS[page]||[])])}>
            <RotateCcw size={14} />
            İlk bölüm sırasına dön
          </button>
        </>
      )}
    </section>
  );
}
