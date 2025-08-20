import "@testing-library/jest-dom";

// Polyfill for next/router or next/navigation as needed
// Next.js 15 App Router components are server-first; client components can still be tested with jsdom.

// Mock ResizeObserver for components relying on it
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = (global as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver || (ResizeObserverMock as unknown as typeof ResizeObserver);
