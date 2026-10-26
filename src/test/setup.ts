import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom has no layout/viewport observers. These mocks exercise UI state only.
class TestIntersectionObserver {
 observe(){} unobserve(){} disconnect(){} takeRecords(){return []}
 root=null;rootMargin='0px';thresholds=[0];
}
class TestResizeObserver {observe(){} unobserve(){} disconnect(){}}
Object.defineProperty(globalThis,'IntersectionObserver',{value:TestIntersectionObserver,writable:true});
Object.defineProperty(globalThis,'ResizeObserver',{value:TestResizeObserver,writable:true});

Object.defineProperty(HTMLCanvasElement.prototype,'getContext',{value:()=>null,writable:true});
