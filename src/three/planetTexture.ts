import * as THREE from "three";

type LoadOpts = {
  renderer: THREE.WebGLRenderer;
  signal?: AbortSignal;
};

// Version-safe helpers for color space
type TextureWithColorSpace = THREE.Texture & { colorSpace: THREE.ColorSpace };
// legacy three: encoding как числовой код
type TextureWithEncoding = THREE.Texture & { encoding: number };

function hasColorSpace(t: THREE.Texture): t is TextureWithColorSpace {
  return "colorSpace" in t;
}
function hasEncoding(t: THREE.Texture): t is TextureWithEncoding {
  return "encoding" in t;
}

function setSRGB(tex: THREE.Texture) {
  if (hasColorSpace(tex)) {
    // new API
    const srgb =
      (THREE as unknown as { SRGBColorSpace?: THREE.ColorSpace }).SRGBColorSpace ?? ("srgb" as THREE.ColorSpace);
    tex.colorSpace = srgb;
  } else if (hasEncoding(tex)) {
    // legacy API: числовой код sRGBEncoding = 3001
    const LEGACY_SRGB_ENCODING = 3001;
    tex.encoding = LEGACY_SRGB_ENCODING;
  }
  tex.needsUpdate = true;
  return tex;
}

export async function loadPlanetTexture({ renderer, signal }: LoadOpts): Promise<THREE.Texture> {
  // Strategy: avoid dev 404 noise by preferring remote in development.
  // Override with NEXT_PUBLIC_TEXTURE_SOURCE=local to force local-first.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLocal = process.env.NEXT_PUBLIC_TEXTURE_SOURCE === "local";
  const preferRemote = isDev && !forceLocal;

  // KTX2: skip probing in dev unless forced local
  const ktx2Local: string[] = ["/textures/earth.ktx2", "/tex/earth.ktx2"];
  const ktx2Candidates: string[] = preferRemote ? [] : ktx2Local;

  // Images: order depends on environment
  const imgRemote: string[] = [
    // CORS-friendly CDNs (pinned)
    "https://unpkg.com/three-globe@2.31.7/example/img/earth-blue-marble.jpg",
    "https://unpkg.com/three-globe@2.31.7/example/img/earth-dark.jpg",
    "https://raw.githubusercontent.com/mentalisit/assets/main/earth/earthmap1k.jpg",
  ];
  const imgLocal: string[] = ["/textures/earth.jpg", "/tex/earth.jpg"];
  const imgCandidates: string[] = preferRemote ? [...imgRemote, ...imgLocal] : [...imgLocal, ...imgRemote];

  // Quick availability probe to avoid long stalls on dead URLs
  async function probe(url: string, timeoutMs = 1500): Promise<boolean> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // Some servers disallow HEAD; fallback to GET if HEAD fails quickly
      try {
        const r = await fetch(url, { method: "HEAD", cache: "no-store", signal: controller.signal });
        if (r.ok) return true;
      } catch {
        const r2 = await fetch(url, { method: "GET", cache: "no-store", signal: controller.signal });
        if (r2.ok) return true;
      }
    } catch {
      /* not available */
    } finally {
      clearTimeout(id);
    }
    return false;
  }

  async function firstAvailable(urls: string[]): Promise<string | null> {
    for (const url of urls) {
      // Prefer probing remote URLs; same-origin is typically fast
      const isRemote = /^https?:\/\//i.test(url);
      const ok = await probe(url, isRemote ? 1500 : 600);
      if (ok) return url;
    }
    return null;
  }

  // Attempt KTX2
  try {
    const { KTX2Loader } = await import("three/examples/jsm/loaders/KTX2Loader.js");
    const ktx2 = new KTX2Loader();
    ktx2.setTranscoderPath("https://unpkg.com/three@0.165.0/examples/jsm/libs/basis/");
    ktx2.detectSupport(renderer);

    const ktx2Url = await firstAvailable(ktx2Candidates);
    if (ktx2Url) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const tex = await ktx2.loadAsync(ktx2Url);
      setSRGB(tex);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    }
  } catch {
    // KTX2Loader not available or KTX2 failed; fall back to image
  }

  // Fallback: standard image texture
  // TextureLoader has no native AbortSignal; if aborted, return placeholder
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const loader = new THREE.TextureLoader();
  // Enable cross-origin for remote textures
  (loader as unknown as { setCrossOrigin?: (v: string) => void }).setCrossOrigin?.("anonymous");

  const imgUrl = await firstAvailable(imgCandidates);
  if (imgUrl) {
    try {
      const tex = await loader.loadAsync(imgUrl);
      setSRGB(tex);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      return tex;
    } catch {
      // fall through to placeholder
    }
  }

  // Last resort: 1x1 placeholder
  const data = new Uint8Array([180, 200, 255]); // pale blue
  const placeholder = new THREE.DataTexture(data, 1, 1, THREE.RGBFormat);
  setSRGB(placeholder);
  return placeholder;
}
