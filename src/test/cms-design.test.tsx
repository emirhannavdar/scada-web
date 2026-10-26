import { it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  emptyDesign,
  designKey,
  validateDesign,
  designCss,
  describeDesignElement,
} from "@/lib/cms-design";
import { cmsChanges, revertCmsChange, revertAllCmsChanges } from "@/lib/cms-changes";
import { DesignEditor } from "@/components/admin/DesignEditor";
import type { VisualWorkspace } from "@/lib/cms-visual-model";
afterEach(cleanup);
const selector = '#main > section[data-cms-section="hardware"] > h2:nth-of-type(1)',
  key = designKey("/", selector);
function design() {
  const d = emptyDesign();
  d.elements[key] = {
    page: "/",
    selector,
    label: "Başlık",
    kind: "text",
    desktop: { fontSize: 48, x: 8 },
    mobile: { fontSize: 24 },
  };
  return d;
}
it("keeps desktop/mobile CSS separate, scopes routes and rejects arbitrary CSS", () => {
  const d = design();
  expect(validateDesign(d)).toEqual(d);
  expect(designCss(d, "/")).toContain("@media(min-width:761px){#root #main");
  expect(designCss(d, "/")).toContain("font-size:24px");
  expect(designCss(d, "/iletisim")).not.toContain("font-size:48px");
  const bad = design();
  bad.elements[key]!.selector = "body";
  expect(() => validateDesign(bad)).toThrow();
});
it("describes marked DOM targets consistently", () => {
  const root = document.createElement("div");
  root.id = "root";
  root.innerHTML =
    '<main id="main"><section data-cms-section="hardware"><h2>Başlık</h2></section></main>';
  document.body.append(root);
  const picked = describeDesignElement(root.querySelector("h2")!);
  expect(picked?.selector).toBe(selector);
  expect(picked?.key).toBe(key);
  root.remove();
});
it("reviews and reverts each design property without losing other changes", () => {
  const w: VisualWorkspace = {
    revision: 0,
    version: 0,
    updated: "",
    catalog: { fields: [] },
    values: {},
    published: {},
    design: design(),
    publishedDesign: emptyDesign(),
  };
  w.design!.palette.light["accent"] = "#ff8800";
  w.design!.homeOrder.reverse();
  const changes = cmsChanges(w);
  expect(changes).toHaveLength(5);
  const next = revertCmsChange(
    w,
    changes.find((c) => c.designPath?.at(-1) === "fontSize" && c.designPath?.includes("desktop"))!,
  );
  expect(next.design!.elements[key]!.desktop).toEqual({ x: 8 });
  expect(next.design!.elements[key]!.mobile.fontSize).toBe(24);
  expect(cmsChanges(revertAllCmsChanges(w))).toEqual([]);
});
it("provides palette and real section ordering controls", () => {
  const change = vi.fn();
  render(
    <DesignEditor
      design={emptyDesign()}
      selected={null}
      theme="light"
      onChange={change}
      onParent={vi.fn()}
      onTheme={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Bölüm sırası" }));
  fireEvent.click(screen.getByRole("button", { name: "Çözümler yukarı taşı" }));
  expect(change.mock.calls[0]?.[0].homeOrder[0]).toBe("solutions");
});
it("edits desktop and mobile independently and resets just the selected property", () => {
  const d = design(),
    change = vi.fn(),
    selected = {
      key,
      page: "/",
      selector,
      label: "Başlık",
      kind: "text" as const,
      parentDisplay: "grid",
      locked: false,
      defaults: { fontSize: "32px", lineHeight: "48px" },
    },
    props = {
      design: d,
      selected,
      onChange: change,
      onParent: vi.fn(),
      onTheme: vi.fn(),
      theme: "light" as const,
    };
  const { rerender } = render(<DesignEditor {...props} />);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Yazı boyutu değeri" }), {
    target: { value: "52" },
  });
  expect(change.mock.calls.at(-1)?.[0].elements[key].desktopLight.fontSize).toBe(52);
  expect(change.mock.calls.at(-1)?.[0].elements[key].desktop.fontSize).toBe(48);
  expect(change.mock.calls.at(-1)?.[0].elements[key].mobile.fontSize).toBe(24);
  rerender(<DesignEditor {...props} device="mobile" />);
  fireEvent.click(screen.getByRole("button", { name: "Yazı boyutu sıfırla" }));
  expect(change.mock.calls.at(-1)?.[0].elements[key].mobileLight.fontSize).toBeUndefined();
  expect(change.mock.calls.at(-1)?.[0].elements[key].mobile.fontSize).toBe(24);
  expect(change.mock.calls.at(-1)?.[0].elements[key].desktop.fontSize).toBe(48);
});
