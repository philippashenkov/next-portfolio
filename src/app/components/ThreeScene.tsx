"use client";
import { useEffect, useRef } from "react";

declare global {
  // Provided by Vitest test env; used to short-circuit WebGL init during tests
  var __VITEST__: boolean | undefined;
  var __IS_TEST__: boolean | undefined;
}
import * as THREE from "three";

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip full WebGL initialization in unit tests (jsdom)
    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
    const isTestFlag = typeof globalThis !== 'undefined' && (globalThis.__VITEST__ || globalThis.__IS_TEST__);
    if (isJsdom || isTestFlag) {
      return;
    }
    const container = mountRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

  // Reset for HMR/StrictMode remounts: remove only previous canvases, keep overlay
  Array.from(container.querySelectorAll('canvas')).forEach((c) => c.parentElement?.removeChild(c));
  overlay.innerHTML = ""; // no longer used for satellites, but safe to clear

    // Settings (reduced-motion aware)
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CFG = {
      MAX_DPR: 1.5,
      STARS: prefersReduced ? 900 : 1200,
      SPHERE_SEG: 48,
      RING_SEG: 64,
      SAT_COUNT: prefersReduced ? 5 : 7,
      EARTH_SPIN: prefersReduced ? 0.18 : 0.24,
      STARS_SPIN: prefersReduced ? 0.07 : 0.1,
      PING_OPACITY: prefersReduced ? 0.4 : 0.6,
      TAIL_OPACITY: prefersReduced ? 0.25 : 0.35,
    } as const;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000010, 0.002);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CFG.MAX_DPR));
      // Settings (reduced-motion aware)
  renderer.shadowMap.enabled = false;
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.zIndex = "1";
  renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lighting with yellow-blue tint
    const keyLight = new THREE.DirectionalLight(0xffe680, 1.0);
    keyLight.position.set(5, 4, 5);
    const rimLight = new THREE.DirectionalLight(0x66ccff, 0.8);
    rimLight.position.set(-6, -2, -4);
    const ambient = new THREE.AmbientLight(0x4060a0, 0.4);
    scene.add(keyLight, rimLight, ambient);

    // Starfield background
  const starsGeom = new THREE.BufferGeometry();
  const starCount = CFG.STARS;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
      const r = 60 * (0.5 + Math.random());
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(p) * Math.cos(t);
      positions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      positions[i * 3 + 2] = r * Math.cos(p);
    }
  starsGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, sizeAttenuation: true });
  const stars = new THREE.Points(starsGeom, starMat);
    scene.add(stars);

    // Earth sphere
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);
  // Axial tilt (deg) around X. Set to 0 so the equator sits level and centered.
  const TILT_DEG = 0;
  earthGroup.rotation.x = THREE.MathUtils.degToRad(TILT_DEG);
  // Face Africa roughly to the camera: Africa ≈ 20°E; default front is 90°E → yaw delta = 20 - 90 = -70°
  const CENTER_LONGITUDE_DEG = 20;
  const yawDeltaDeg = CENTER_LONGITUDE_DEG - 90;
  earthGroup.rotation.y = THREE.MathUtils.degToRad(yawDeltaDeg);
  const earthGeom = new THREE.SphereGeometry(1.4, CFG.SPHERE_SEG, CFG.SPHERE_SEG);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x89b4ff,
      roughness: 0.8,
      metalness: 0.1,
      emissive: 0x0a1a3a,
      emissiveIntensity: 0.2,
    });
    const earth = new THREE.Mesh(earthGeom, earthMat);
    earthGroup.add(earth);

    // Atmosphere glow (faked with additive transparent sphere)
    const atmoGeom = new THREE.SphereGeometry(1.48, CFG.SPHERE_SEG, CFG.SPHERE_SEG);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const atmosphere = new THREE.Mesh(atmoGeom, atmoMat);
    atmosphere.renderOrder = 0;
  earthGroup.add(atmosphere);

  // ---- Helpers ----
  const disposables: Array<THREE.BufferGeometry | THREE.Material | THREE.Texture | THREE.Light> = [];

    const makeGlowTexture = () => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(150,220,255,0.9)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,size,size);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    };
    const glowTex = makeGlowTexture();
    disposables.push(glowTex);

    function glowSprite(color: number, scale = 0.18) {
      const mat = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(scale);
      disposables.push(mat);
      return sprite;
    }

  // no mesh materials needed for symbol sprites

  // Minimal neon text sprites as satellites

    function makeTextTexture(text: string, color: string) {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0,0,size,size);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 140px Orbitron, Arial, Helvetica, sans-serif';
      // soft outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.fillStyle = color;
      ctx.fillText(text, size/2, size/2);
      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 4;
      return tex;
    }

    function makeRingTexture(color: string) {
      const s = 256; const rOut = 120; const rIn = 84;
      const c = document.createElement('canvas'); c.width = c.height = s;
      const x = s/2, y = s/2; const ctx = c.getContext('2d')!;
      ctx.clearRect(0,0,s,s);
      ctx.beginPath(); ctx.arc(x,y,rOut,0,Math.PI*2);
      ctx.lineWidth = rOut - rIn;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = 2; return tex;
    }

    function makeSymbolNode(symbol: string, colorHex: number) {
      const colorCss = `#${colorHex.toString(16).padStart(6,'0')}`;
      const g = new THREE.Group();
      const textTex = makeTextTexture(symbol, colorCss);
      const textMat = new THREE.SpriteMaterial({ map: textTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const text = new THREE.Sprite(textMat);
      text.scale.setScalar(0.22);
      const halo = glowSprite(colorHex, 0.28);
      halo.position.z = -0.001;
      g.add(halo, text);
      disposables.push(textTex, textMat);

      // ping ring
      const ringTex = makeRingTexture(colorCss);
  const ringMat = new THREE.SpriteMaterial({ map: ringTex, transparent: true, depthWrite: false, opacity: 0.0, blending: THREE.AdditiveBlending });
      const ring = new THREE.Sprite(ringMat);
      ring.scale.setScalar(0.18);
  g.add(ring);
      disposables.push(ringTex, ringMat);
  return { group: g, ping: ring, text };
    }

    // symbols and colors
  const symbols = ['*', '#', '</>', '`O.', '[$]', '=>', '`•'];
    const colors = [0x9ad6ff, 0x66ccff, 0xbbe9ff, 0xcaf7ff, 0x8fdcff, 0xa8e0ff, 0x7fd1ff];

    // ---- GeoJSON country boundaries (neon minimal lines) ----
    // Convert lon/lat to a 3D point on the sphere surface
    const NEON = 0x33e0ff;
    function lonLatToVector3(radius: number, lonDeg: number, latDeg: number) {
      const lat = THREE.MathUtils.degToRad(latDeg);
      const lon = THREE.MathUtils.degToRad(lonDeg);
      const x = radius * Math.cos(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(lon);
      return new THREE.Vector3(x, y, z);
    }

    type LonLat = [number, number];
    type PolygonCoords = LonLat[][]; // [rings][points]
    type MultiPolygonCoords = LonLat[][][];
    type GeoJSONGeometry =
      | { type: 'Polygon'; coordinates: PolygonCoords }
      | { type: 'MultiPolygon'; coordinates: MultiPolygonCoords };
    type GeoJSONFeature = { geometry: GeoJSONGeometry | null };
    type GeoJSONFeatureCollection = { features: GeoJSONFeature[] };

    async function loadGeoJSONCountries() {
      const urls = [
        "/geo/countries-110m.geojson", // try local if provided
        "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
      ];
      let data: GeoJSONFeatureCollection | null = null;
      for (const url of urls) {
        try {
          const controller = new AbortController();
          const to = url.startsWith('http') ? setTimeout(() => controller.abort(), 1500) : null;
          const res = await fetch(url, { cache: "force-cache", signal: controller.signal });
          if (to) clearTimeout(to);
          if (!res.ok) continue;
          data = (await res.json()) as GeoJSONFeatureCollection;
          break;
        } catch { /* try next */ }
      }
      if (!data || !data.features) {
        console.warn("GeoJSON: no data loaded. Add public/geo/countries-110m.geojson or ensure remote fetch is allowed.");
        return;
      }

  const r = 1.43; // slightly above Earth surface to avoid z-fighting and sit above diffuse rim
      const positions: number[] = [];

  const pushRing = (ring: LonLat[]) => {
        // ring is array of [lon, lat]
        for (let i = 0; i < ring.length - 1; i++) {
          const a = ring[i];
          const b = ring[i + 1];
          const va = lonLatToVector3(r, a[0], a[1]);
          const vb = lonLatToVector3(r, b[0], b[1]);
          positions.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
        }
      };

      const features = data.features;
      // Chunk processing to avoid long main-thread stalls
      const CHUNK = 40;
      for (let i = 0; i < features.length; i += CHUNK) {
        const slice = features.slice(i, i + CHUNK);
        for (const f of slice) {
          const geom = f.geometry;
          if (!geom) continue;
          if (geom.type === "Polygon") {
            const coords = geom.coordinates; // [rings][points][lon,lat]
            if (coords[0]) pushRing(coords[0]);
          } else if (geom.type === "MultiPolygon") {
            const polys = geom.coordinates;
            for (const poly of polys) if (poly[0]) pushRing(poly[0]);
          }
        }
        await new Promise(requestAnimationFrame);
      }

      if (positions.length > 0) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  const mat = new THREE.LineBasicMaterial({ color: NEON, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(geo, mat);
  lines.renderOrder = 3; // draw after atmosphere for clarity
        earthGroup.add(lines);
        disposables.push(geo, mat);
      }
    }
    // Fire and forget; no need to await render start
    loadGeoJSONCountries();

    // Orbits + symbol satellites with evenly distributed orbit planes (Fibonacci sphere normals)
  const satCount = CFG.SAT_COUNT;
    const golden = Math.PI * (3 - Math.sqrt(5));
    type SatState = {
      plane: THREE.Object3D;
      rotator: THREE.Object3D;
      node: THREE.Group; // contains symbol + halo
      sym: THREE.Group; // the symbol group returned by makeSymbolNode().group
      ping: THREE.Sprite;
      textSprite: THREE.Sprite;
      tail: THREE.Sprite;
      prevAngle: number;
      speed: number;
      spin: number;
      time: number;
      color: number;
      radius: number;
      // DOM overlay for header-overlap case
      dom: HTMLSpanElement;
      symbol: string;
    };
  const sats: SatState[] = [];
  // Create top-level HTML overlay attached to body to escape stacking contexts
  const domOverlay = document.createElement('div');
  domOverlay.style.position = 'fixed';
  domOverlay.style.left = '0';
  domOverlay.style.top = '0';
  domOverlay.style.width = '100vw';
  domOverlay.style.height = '100vh';
  domOverlay.style.pointerEvents = 'none';
  domOverlay.style.zIndex = '999999999';
  document.body.appendChild(domOverlay);
  // Build satellites over multiple frames
      const buildSats = (startIndex = 0, perFrame = 3) => {
        let i = startIndex;
        const step = () => {
          const end = Math.min(satCount, i + perFrame);
          for (; i < end; i++) {
            // Plane normal via Fibonacci sphere
            const t = (i + 0.5) / satCount;
            const y = 1 - 2 * t; // [-1,1]
            const r = Math.sqrt(Math.max(0, 1 - y * y));
            const phi = i * golden;
            const nx = Math.cos(phi) * r;
            const nz = Math.sin(phi) * r;
            const normal = new THREE.Vector3(nx, y, nz).normalize();

            const radius = 2.15 + (i % 5) * 0.28;

            // Plane group oriented so its local +Z matches the plane normal
            const plane = new THREE.Object3D();
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
            plane.quaternion.copy(q);
            earthGroup.add(plane);

            // Orbit ring in the plane (ring lies in XY by default; rotate by same q)
            const orbit = new THREE.RingGeometry(radius - 0.001, radius + 0.001, CFG.RING_SEG);
            const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
            const orbitMesh = new THREE.Mesh(orbit, orbitMat);
            orbitMesh.rotation.x = 0; // stays in XY for plane local space
            orbitMesh.quaternion.copy(new THREE.Quaternion()); // identity in plane space
            plane.add(orbitMesh);
            disposables.push(orbit, orbitMat);

            // Rotator spins around plane's local Z (which equals world 'normal')
            const rotator = new THREE.Object3D();
            plane.add(rotator);

            // Create symbol node
            const color = colors[i % colors.length];
            const symbol = symbols[i % symbols.length];
            const { group: symGroup, ping, text } = makeSymbolNode(symbol, color);
            const node = new THREE.Group();
            node.add(symGroup);
            node.position.set(radius, 0, 0); // on X axis of the plane's XY ring
            rotator.add(node);

            // DOM element overlay (above header when overlapping)
            const span = document.createElement('span');
            span.textContent = symbol;
            span.style.position = 'fixed';
            span.style.left = '0';
            span.style.top = '0';
            span.style.transform = 'translate(-9999px,-9999px)';
            span.style.font = 'bold 14px Orbitron, Arial, Helvetica, sans-serif';
            span.style.color = `#${color.toString(16).padStart(6,'0')}`;
            span.style.textShadow = '0 0 6px rgba(51,224,255,0.9), 0 0 12px rgba(51,224,255,0.6)';
            span.style.userSelect = 'none';
            domOverlay.appendChild(span);

            // Tail sprite lives in plane space so it lags behind orbit
            const tail = glowSprite(color, 0.16);
            (tail.material as THREE.SpriteMaterial).opacity = 0.0;
            plane.add(tail);

            // randomize start phase
            rotator.rotation.z = Math.random() * Math.PI * 2;

            sats.push({
              plane,
              rotator,
              node,
              sym: symGroup,
              ping,
              textSprite: text,
              tail,
              prevAngle: rotator.rotation.z,
              speed: 0.35 + (i % 6) * 0.08,
              spin: 0.8 + (i % 5) * 0.25,
              time: Math.random() * 10,
              color,
              radius,
              dom: span,
              symbol,
            });
          }
          if (i < satCount) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
  buildSats(0, 3);

    // Animation loop
    let raf = 0;
    let last = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Spin the whole Earth system (surface, atmosphere, borders)
  earthGroup.rotation.y += CFG.EARTH_SPIN * dt;
  stars.rotation.y += CFG.STARS_SPIN * dt;

  // locate header (cache per frame, cheap)
  const headerEl = document.querySelector('header, nav, [role="banner"]') as HTMLElement | null;
  const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 80;

  sats.forEach((s) => {
        // orbit progression
        s.rotator.rotation.z += s.speed * dt; // around plane normal
        // spin/pulse of the symbol
        s.node.rotation.z += s.spin * 0.1 * dt;
        s.time += dt;
        const pulse = 1 + 0.1 * Math.sin(s.time * (1.2 + (s.speed * 0.5)) + (s.radius * 0.3));
        s.sym.scale.setScalar(pulse);

        // ping ring: expand and fade on a loop
  const period = 2.6 + (s.radius * 0.05);
  const t = (s.time % period) / period;
  const pingMat = s.ping.material as THREE.SpriteMaterial;
  s.ping.scale.setScalar(0.18 + t * 0.5);
  pingMat.opacity = CFG.PING_OPACITY * (1 - t);

        // trailing ghost in plane space
        const curr = s.rotator.rotation.z;
        // ease prev angle toward a bit behind current
        const target = curr - 0.25;
        s.prevAngle += (target - s.prevAngle) * Math.min(1, 6 * dt);
        const tx = Math.cos(s.prevAngle) * s.radius;
        const ty = Math.sin(s.prevAngle) * s.radius;
        s.tail.position.set(tx, ty, 0);
        const tailMat = s.tail.material as THREE.SpriteMaterial;
  tailMat.opacity = CFG.TAIL_OPACITY;
        tailMat.rotation = s.prevAngle + Math.PI * 0.5; // orient slightly along tangent

        // Project to screen and handle header overlap
        const world = new THREE.Vector3();
        s.node.getWorldPosition(world);
        world.project(camera);
        if (mountRef.current) {
          const rect = mountRef.current.getBoundingClientRect();
          const sx = rect.left + ((world.x + 1) / 2) * rect.width;
          const sy = rect.top + ((1 - world.y) / 2) * rect.height;
          const isOverHeader = sy <= headerBottom && sx >= rect.left && sx <= rect.right;
          if (isOverHeader) {
            // show DOM glyph above header; hide 3D text to avoid double
            s.dom.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px)`;
            s.dom.style.display = 'block';
            s.textSprite.visible = false;
          } else {
            s.dom.style.display = 'none';
            s.textSprite.visible = true;
          }
        }
      });

      renderer.render(scene, camera);
    };
    animate();

  // Handle resize
    const onResize = () => {
      if (!mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Adjust contrast per theme
    const applyTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const light = theme === 'light';
      // On light background, make stars cooler and slightly larger
      starMat.color.set(light ? 0x66ccff : 0xffffff);
      starMat.size = light ? 0.28 : 0.2;
      starMat.needsUpdate = true;
      // Slightly stronger emissive/atmo on light for contrast
      (earth.material as THREE.MeshStandardMaterial).emissiveIntensity = light ? 0.3 : 0.2;
      atmoMat.opacity = light ? 0.3 : 0.25;
      atmoMat.needsUpdate = true;
    };
    applyTheme();
    const mo = new MutationObserver(applyTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
  window.removeEventListener("resize", onResize);
  mo.disconnect();
  // dispose helper resources
      disposables.forEach((d) => {
        if (d.dispose) d.dispose();
      });
  // remove DOM overlay
  if (domOverlay.parentElement) domOverlay.parentElement.removeChild(domOverlay);
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
      renderer.dispose();
      earthGeom.dispose();
      atmoGeom.dispose();
      starsGeom.dispose();
    };
  }, []);

  return (
  <div ref={mountRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={overlayRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }} />
    </div>
  );
}
