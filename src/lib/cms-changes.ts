import { styleNames, sectionNames } from "./cms-design-labels";
import { emptyDesign } from "../../shared/design.mjs";
import type { CmsCollections, CollectionKind, CollectionItem } from "./cms-collections";
import type { VisualWorkspace, VisualValue } from "./cms-visual-model";
export type ChangeSide = { value: unknown; en?: unknown };
export type CmsChange = {
  id: string;
  type: "field" | "add" | "remove" | "property" | "order" | "design";
  designPath?: string[];
  group: string;
  label: string;
  kind: string;
  before: ChangeSide;
  after: ChangeSide;
  field?: string;
  collection?: CollectionKind;
  record?: string;
  property?: string;
};
export const changeLabels: Record<string, string> = {
  products: "Donanımlar",
  solutions: "Çözümler",
  plans: "Paketler",
  code: "Cihaz kodu",
  name: "Ad",
  title: "Başlık",
  image: "Görsel",
  tagline: "Kısa başlık",
  summary: "Açıklama",
  role: "Görevi",
  short: "Kısa açıklama",
  headline: "Ana başlık",
  caption: "Görsel açıklaması",
  term: "Süre",
  features: "Hizmetler",
  body: "Açıklama paragrafları",
  points: "Öne çıkan özellikler",
  specifications: "Teknik özellikler",
  comparison: "Paket karşılaştırması",
  recommended: "Önerilen paket",
  featured: "Ana sayfada göster",
  value: "Değer",
};
export function stable(value: unknown): string {
  return JSON.stringify(
    value && typeof value === "object"
      ? Array.isArray(value)
        ? value.map((v) => JSON.parse(stable(v)))
        : Object.fromEntries(
            Object.entries(value)
              .filter(([, v]) => v !== undefined)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, JSON.parse(stable(v))]),
          )
      : (value ?? null),
  );
}
const same = (a: unknown, b: unknown) => stable(a) === stable(b),
  identity = (item: CollectionItem) => item.slug || item.id || "",
  name = (item: CollectionItem) => String(item.code || item.title || item.name || identity(item));
const value = (v: VisualValue): ChangeSide => ({ value: v.tr, en: v.en });
export function cmsChanges(workspace: VisualWorkspace): CmsChange[] {
  const changes: CmsChange[] = [];
  for (const field of workspace.catalog.fields) {
    const root = field.path?.[0];
    if (
      workspace.collections &&
      workspace.publishedCollections &&
      ["products", "productSpecifications", "solutions", "plans", "applicationStories"].includes(
        root || "",
      )
    )
      continue;
    if (workspace.collections && root === "comparison" && field.path?.[2] !== "0") continue;
    const before = workspace.published[field.id] ?? field.default,
      after = workspace.values[field.id] ?? field.default;
    if (same(before, after)) continue;
    changes.push({
      id: field.id,
      type: "field",
      field: field.id,
      group: field.location || field.group,
      label: field.label + (field.retired ? " (arşiv alanı)" : ""),
      kind: field.kind,
      before: value(before),
      after: value(after),
    });
  }
  const currentDesign = workspace.design ?? emptyDesign(),
    publishedDesign = workspace.publishedDesign ?? emptyDesign();
  const addDesign = (path: string[], label: string, b: unknown, a: unknown, kind = "text") => {
    if (!same(b, a))
      changes.push({
        id: "design/" + path.join("/"),
        type: "design",
        designPath: path,
        group: "Tasarım ve yerleşim",
        label,
        kind,
        before: { value: b ?? "Varsayılan" },
        after: { value: a ?? "Varsayılan" },
      });
  };
  for (const theme of ["light", "dark"] as const)
    for (const key of new Set([
      ...Object.keys(currentDesign.palette[theme]),
      ...Object.keys(publishedDesign.palette[theme]),
    ]))
      addDesign(
        ["palette", theme, key],
        (theme === "light" ? "Gündüz" : "Gece") +
          " / " +
          ({
            accent: "Vurgu rengi",
            text: "Ana metin",
            background: "Sayfa zemini",
            surface: "Kart / yüzey",
            muted: "İkincil metin",
          }[key] || key),
        publishedDesign.palette[theme][key],
        currentDesign.palette[theme][key],
        "color",
      );
  for (const key of new Set([
    ...Object.keys(currentDesign.elements),
    ...Object.keys(publishedDesign.elements),
  ])) {
    const a = currentDesign.elements[key],
      b = publishedDesign.elements[key];
    for (const profile of ["desktop", "mobile", "desktopLight", "desktopDark", "mobileLight", "mobileDark"] as const)
      for (const prop of new Set([
        ...Object.keys(a?.[profile] ?? {}),
        ...Object.keys(b?.[profile] ?? {}),
      ]))
        addDesign(
          ["elements", key, profile, prop],
          (a ?? b)!.label +
            " / " +
            (profile.startsWith("desktop") ? "Masaüstü" : "Mobil") + (profile.endsWith("Light") ? " / Aydınlık" : profile.endsWith("Dark") ? " / Karanlık" : "") +
            " / " +
            (styleNames[prop] || prop),
          (b?.[profile] as Record<string, unknown> | undefined)?.[prop],
          (a?.[profile] as Record<string, unknown> | undefined)?.[prop],
        );
  }
  addDesign(
    ["homeOrder"],
    "Ana sayfa bölüm sırası",
    publishedDesign.homeOrder.map((id) => sectionNames[id] || id),
    currentDesign.homeOrder.map((id) => sectionNames[id] || id),
    "order",
  );
  if (!workspace.collections || !workspace.publishedCollections) return changes;
  for (const kind of ["products", "solutions", "plans"] as const) {
    const current = workspace.collections[kind],
      published = workspace.publishedCollections[kind],
      beforeMap = new Map(published.map((item) => [identity(item), item])),
      afterMap = new Map(current.map((item) => [identity(item), item]));
    for (const before of published) {
      const id = identity(before);
      if (!afterMap.has(id))
        changes.push({
          id: `${kind}/${id}/removed`,
          type: "remove",
          collection: kind,
          record: id,
          group: changeLabels[kind]!,
          label: name(before),
          kind: "record",
          before: { value: before },
          after: { value: undefined },
        });
    }
    for (const after of current) {
      const id = identity(after),
        before = beforeMap.get(id);
      if (!before) {
        changes.push({
          id: `${kind}/${id}/added`,
          type: "add",
          collection: kind,
          record: id,
          group: changeLabels[kind]!,
          label: name(after),
          kind: "record",
          before: { value: undefined },
          after: { value: after },
        });
        continue;
      }
      for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
        if (["en", "id", "slug", "hotspots"].includes(key)) continue;
        const effective = (item: CollectionItem) =>
          key === "recommended"
            ? Boolean(item[key])
            : key === "featured"
              ? item[key] !== false
              : item[key];
        const translated = !["code", "image", "recommended", "featured"].includes(key),
          b = { value: effective(before), ...(translated ? { en: before.en[key] } : {}) },
          a = { value: effective(after), ...(translated ? { en: after.en[key] } : {}) };
        if (same(b, a)) continue;
        changes.push({
          id: `${kind}/${id}/${key}`,
          type: "property",
          collection: kind,
          record: id,
          property: key,
          group: changeLabels[kind]!,
          label: name(after) + " / " + (changeLabels[key] || key),
          kind: key === "image" ? "image" : typeof after[key] === "boolean" ? "boolean" : "text",
          before: b,
          after: a,
        });
      }
    }
    const oldOrder = published.filter((item) => afterMap.has(identity(item))).map(identity),
      newOrder = current.filter((item) => beforeMap.has(identity(item))).map(identity);
    if (!same(oldOrder, newOrder))
      changes.push({
        id: `${kind}/order`,
        type: "order",
        collection: kind,
        group: changeLabels[kind]!,
        label: "Sıralama",
        kind: "order",
        before: { value: oldOrder.map((id) => name(beforeMap.get(id)!)) },
        after: { value: newOrder.map((id) => name(afterMap.get(id)!)) },
      });
  }
  return changes;
}
export function revertCmsChange(workspace: VisualWorkspace, change: CmsChange): VisualWorkspace {
  if (change.type === "field" && change.field) {
    const values = { ...workspace.values };
    if (Object.hasOwn(workspace.published, change.field))
      values[change.field] = structuredClone(workspace.published[change.field]!);
    else delete values[change.field];
    return { ...workspace, values };
  }
  if (change.type === "design" && change.designPath) {
    const design = structuredClone(workspace.design ?? emptyDesign()),
      published = workspace.publishedDesign ?? emptyDesign(),
      [root, key, profile, prop] = change.designPath;
    if (root === "homeOrder") design.homeOrder = [...published.homeOrder];
    else if (root === "palette" && key && profile) {
      const theme = key as "light" | "dark";
      if (published.palette[theme][profile] !== undefined)
        design.palette[theme][profile] = published.palette[theme][profile]!;
      else delete design.palette[theme][profile];
    } else if (root === "elements" && key && profile && prop) {
      const baseline = published.elements[key],
        device = profile as "desktop" | "mobile" | "desktopLight" | "desktopDark" | "mobileLight" | "mobileDark";
      if (!design.elements[key] && baseline)
        design.elements[key] = { ...structuredClone(baseline), desktop: {}, mobile: {} };
      const entry = design.elements[key];
      if (entry) {
        const rules = (entry[device] ??= {}) as Record<string, unknown>,
          old = baseline?.[device] as Record<string, unknown> | undefined;
        if (old?.[prop] !== undefined) rules[prop] = old[prop];
        else delete rules[prop];
        if (!["desktop","mobile","desktopLight","desktopDark","mobileLight","mobileDark"].some(profile=>Object.keys((entry as unknown as Record<string,object>)[profile]??{}).length))
          delete design.elements[key];
      }
    }
    return { ...workspace, design };
  }
  if (!change.collection || !workspace.collections || !workspace.publishedCollections)
    return workspace;
  const kind = change.collection,
    collections = structuredClone(workspace.collections),
    current = collections[kind],
    published = workspace.publishedCollections[kind],
    before = published.find((item) => identity(item) === change.record);
  if (change.type === "add")
    collections[kind] = current.filter((item) => identity(item) !== change.record);
  else if (
    change.type === "remove" &&
    before &&
    !current.some((item) => identity(item) === change.record)
  ) {
    const index = published.indexOf(before),
      following = published
        .slice(index + 1)
        .map(identity)
        .find((id) => current.some((item) => identity(item) === id));
    const at = following
      ? current.findIndex((item) => identity(item) === following)
      : current.length;
    current.splice(at, 0, structuredClone(before));
  } else if (change.type === "property" && change.property && before) {
    const item = current.find((item) => identity(item) === change.record);
    if (item) {
      const key = change.property;
      if (Object.hasOwn(before, key)) item[key] = structuredClone(before[key]);
      else delete item[key];
      if (Object.hasOwn(before.en, key)) item.en[key] = structuredClone(before.en[key]);
      else delete item.en[key];
    }
  } else if (change.type === "order") {
    const original = new Map(published.map((item, i) => [identity(item), i]));
    const sorted = current
      .filter((item) => original.has(identity(item)))
      .sort((a, b) => original.get(identity(a))! - original.get(identity(b))!);
    collections[kind] = current.map((item) =>
      original.has(identity(item)) ? sorted.shift()! : item,
    );
  }
  return { ...workspace, collections };
}
export function revertAllCmsChanges(workspace: VisualWorkspace): VisualWorkspace {
  return {
    ...workspace,
    values: structuredClone(workspace.published),
    design: structuredClone(workspace.publishedDesign ?? emptyDesign()),
    ...(workspace.publishedCollections
      ? { collections: structuredClone(workspace.publishedCollections) }
      : {}),
  };
}
