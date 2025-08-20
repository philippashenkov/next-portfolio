import "@testing-library/jest-dom";

// Polyfill matchMedia for components using it in effects
if (typeof window !== "undefined" && !window.matchMedia) {
  (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// Expose a global test flag for runtime guards in components
declare global {
  var __IS_TEST__: boolean | undefined;
}
globalThis.__IS_TEST__ = true;
