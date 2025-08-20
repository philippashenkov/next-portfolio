import * as THREE from "three";
import type { Texture, WebGLRenderer } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

export type PlanetTextureOptions = {
  renderer: WebGLRenderer;
  baseName?: string; // e.g., 'earth'
  path?: string; // e.g., '/textures'
  sizes?: Array<"2k" | "4k">;
  signal?: AbortSignal;
};

type Size = "2k" | "4k";

function pickSize(): Size {
  if (typeof window === "undefined") return "2k";
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = Math.max(window.screen?.width || 1, window.innerWidth || 1);
  return dpr > 1.5 && w >= 1200 ? "4k" : "2k";
}

export function planUrls({
  baseName = "earth",
  path = "/textures",
  sizes = ["2k", "4k"],
}: Partial<PlanetTextureOptions>) {
  const size = pickSize();
  const chosen = (sizes as Size[]).includes(size) ? size : (sizes[0] as Size);
  return {
    ktx2Url: `${path}/${baseName}-${chosen}.ktx2`,
    jpgUrl: `${path}/${baseName}-${chosen}.jpg`,
  };
}

export async function loadPlanetTexture(opts: PlanetTextureOptions): Promise<Texture> {
  const { renderer, signal } = opts;
  const { ktx2Url, jpgUrl } = planUrls(opts);

  // Warm up request; non-blocking
  try {
    fetch(ktx2Url, { cache: "force-cache" });
  } catch {}

  // Try GPU-compressed KTX2 first
  try {
    const ktx2 = new KTX2Loader().setTranscoderPath("/basis/").detectSupport(renderer);
    const tex = await ktx2.loadAsync(ktx2Url);
    if ("colorSpace" in (tex as unknown as Record<string, unknown>)) {
      (tex as unknown as Record<string, unknown>)["colorSpace"] = (THREE as unknown as Record<string, unknown>)["SRGBColorSpace"];
    } else if ("encoding" in (tex as unknown as Record<string, unknown>) && (THREE as unknown as Record<string, unknown>)["sRGBEncoding"] !== undefined) {
      (tex as unknown as Record<string, unknown>)["encoding"] = (THREE as unknown as Record<string, unknown>)["sRGBEncoding"];
    }
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.generateMipmaps = false; // already in KTX2
    tex.needsUpdate = true;
    if (signal) signal.addEventListener("abort", () => ktx2.dispose(), { once: true });
    return tex;
  } catch {
    // Fallback to JPG/PNG
    const jpg = await new THREE.TextureLoader().loadAsync(jpgUrl);
    if ("colorSpace" in (jpg as unknown as Record<string, unknown>)) {
      (jpg as unknown as Record<string, unknown>)["colorSpace"] = (THREE as unknown as Record<string, unknown>)["SRGBColorSpace"];
    } else if ("encoding" in (jpg as unknown as Record<string, unknown>) && (THREE as unknown as Record<string, unknown>)["sRGBEncoding"] !== undefined) {
      (jpg as unknown as Record<string, unknown>)["encoding"] = (THREE as unknown as Record<string, unknown>)["sRGBEncoding"];
    }
    jpg.anisotropy = renderer.capabilities.getMaxAnisotropy();
    jpg.generateMipmaps = true;
    jpg.needsUpdate = true;
    return jpg;
  }
}
