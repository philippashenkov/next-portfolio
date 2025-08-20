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
  // Try KTX2 first (if available), then JPG/PNG
  const ktx2Candidates = [
    "/textures/earth.ktx2",
    "/tex/earth.ktx2",
  ];
  const imgCandidates = [
    "/textures/earth.jpg",
    "/tex/earth.jpg",
    // remote fallback (small)
    "https://raw.githubusercontent.com/mentalisit/assets/main/earth/earthmap1k.jpg",
  ];

  // Attempt KTX2
  try {
    const { KTX2Loader } = await import("three/examples/jsm/loaders/KTX2Loader.js");
    const ktx2 = new KTX2Loader();
    // Use CDN transcoder as safe default; replace with local path if you host it
    ktx2.setTranscoderPath("https://unpkg.com/three@0.165.0/examples/jsm/libs/basis/");
    ktx2.detectSupport(renderer);

    for (const url of ktx2Candidates) {
      try {
        // KTX2Loader doesn't support AbortSignal; ignore if aborted
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        const tex = await ktx2.loadAsync(url);
        setSRGB(tex);
        // Setup sampling
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return tex;
      } catch {
        /* try next */
      }
    }
  } catch {
    // KTX2Loader not available or failed; fall back to image
  }

  // Fallback: standard image texture
  // TextureLoader has no native AbortSignal; if aborted, return placeholder
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const loader = new THREE.TextureLoader();
  for (const url of imgCandidates) {
    try {
      const tex = await loader.loadAsync(url);
      setSRGB(tex);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      return tex;
    } catch {
      /* try next */
    }
  }

  // Last resort: 1x1 placeholder
  const data = new Uint8Array([180, 200, 255]); // pale blue
  const placeholder = new THREE.DataTexture(data, 1, 1, THREE.RGBFormat);
  setSRGB(placeholder);
  return placeholder;
}
