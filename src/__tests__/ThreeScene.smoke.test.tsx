import { render } from "@testing-library/react";
import React from "react";
import ThreeScene from "../app/components/ThreeScene";

// Smoke test: ensure component can mount in jsdom without throwing.
// We mock WebGL contexts since jsdom doesn't provide them.

declare global {
  interface HTMLCanvasElement {
    getContext(contextId: string, options?: any): any;
  }
}

beforeAll(() => {
  // Basic mock that returns an object for 'webgl'/'webgl2' and null otherwise
  HTMLCanvasElement.prototype.getContext = function (id: string) {
    if (id === "webgl" || id === "webgl2") {
      return {} as any;
    }
    return null;
  };
});

describe("ThreeScene", () => {
  it("mounts without crashing", () => {
    // Suppress console.error for missing WebGL features
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThreeScene />)).not.toThrow();
    spy.mockRestore();
  });
});
