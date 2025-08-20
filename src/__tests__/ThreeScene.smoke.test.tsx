import { render } from "@testing-library/react";
import React from "react";
import ThreeScene from "../app/components/ThreeScene";

// Smoke test: ensure component can mount in jsdom without throwing.
// We mock WebGL contexts since jsdom doesn't provide them.

declare global {
  interface HTMLCanvasElement {
    getContext(
      contextId: string,
      options?: WebGLContextAttributes
    ): WebGLRenderingContext | WebGL2RenderingContext | null;
  }
}

beforeAll(() => {
  // Basic mock that returns an object for 'webgl'/'webgl2' and null otherwise
  type AnyCtx =
    | CanvasRenderingContext2D
    | ImageBitmapRenderingContext
    | WebGLRenderingContext
    | WebGL2RenderingContext
    | null;
  const orig = HTMLCanvasElement.prototype.getContext?.bind(
    HTMLCanvasElement.prototype
  ) as ((id: string, options?: unknown) => AnyCtx) | undefined;

  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: function (id: string, options?: unknown): AnyCtx {
      if (id === "webgl" || id === "webgl2") {
        return {} as unknown as WebGLRenderingContext;
      }
      return orig ? orig.call(this, id, options) : null;
    },
  });
});

describe("ThreeScene", () => {
  it("mounts without crashing", () => {
    // Suppress console.error for missing WebGL features
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThreeScene />)).not.toThrow();
    spy.mockRestore();
  });
});
