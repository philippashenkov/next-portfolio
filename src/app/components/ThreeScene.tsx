"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

  // Reset for HMR/StrictMode remounts: remove only previous canvases, keep overlay
  Array.from(container.querySelectorAll('canvas')).forEach((c) => c.parentElement?.removeChild(c));
  overlay.innerHTML = ""; // no longer used for satellites, but safe to clear

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = false;
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.zIndex = "1";
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
    const starCount = 1500;
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
    const stars = new THREE.Points(
      starsGeom,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, sizeAttenuation: true })
    );
    scene.add(stars);

    // Earth sphere
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);
  // Axial tilt ~23.5° for a nicer, realistic rotation
  earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);
    const earthGeom = new THREE.SphereGeometry(1.4, 64, 64);
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
    const atmoGeom = new THREE.SphereGeometry(1.48, 64, 64);
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
      const mat = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(scale);
      disposables.push(mat);
      return sprite;
    }

  function material(color: number) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2, emissive: color, emissiveIntensity: 0.35 });
      disposables.push(m);
      return m;
    }

    const geoms: Record<string, THREE.BufferGeometry> = {};
    const getGeom = (key: string, factory: () => THREE.BufferGeometry) => {
      if (!geoms[key]) { geoms[key] = factory(); disposables.push(geoms[key]); }
      return geoms[key];
    };

    function makeRocket(color = 0xffe08a) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(getGeom('rocketBody', () => new THREE.CylinderGeometry(0.04, 0.04, 0.22, 12)), material(color));
      const nose = new THREE.Mesh(getGeom('rocketNose', () => new THREE.ConeGeometry(0.05, 0.08, 12)), material(color));
      nose.position.y = 0.15;
      const tail = new THREE.Mesh(getGeom('rocketTail', () => new THREE.ConeGeometry(0.035, 0.06, 10)), material(0x8ec5ff));
      tail.position.y = -0.14; tail.rotation.x = Math.PI;
      // fins
      const finGeom = getGeom('rocketFin', () => new THREE.BoxGeometry(0.02, 0.06, 0.004));
      const fin1 = new THREE.Mesh(finGeom, material(0x9ad6ff)); fin1.position.set(0.03, -0.11, 0);
      const fin2 = fin1.clone(); fin2.position.x = -0.03;
      g.add(body, nose, tail, fin1, fin2, glowSprite(0xffffff, 0.22));
      g.rotation.z = Math.PI / 2; // point along +X
      const light = new THREE.PointLight(0xffc070, 0.5, 1.2);
      light.position.set(-0.08, 0, 0);
      g.add(light); disposables.push(light);
      return g;
    }

    function makeSatellite(color = 0x9ad6ff) {
      const g = new THREE.Group();
      const core = new THREE.Mesh(getGeom('satCore', () => new THREE.BoxGeometry(0.06, 0.06, 0.06)), material(color));
      const panelGeom = getGeom('satPanel', () => new THREE.PlaneGeometry(0.18, 0.06));
      const panelL = new THREE.Mesh(panelGeom, material(0x66ccff)); panelL.position.x = -0.12; panelL.rotation.y = Math.PI;
      const panelR = new THREE.Mesh(panelGeom, material(0x66ccff)); panelR.position.x = 0.12;
      g.add(core, panelL, panelR, glowSprite(0xbbe9ff, 0.18));
      const light = new THREE.PointLight(0x9ad6ff, 0.4, 0.9); g.add(light); disposables.push(light);
      return g;
    }

    function makePlane(color = 0xffffff) {
      const g = new THREE.Group();
      const fuselage = new THREE.Mesh(getGeom('planeBody', () => new THREE.CapsuleGeometry(0.035, 0.18, 6, 12)), material(color));
      const wing = new THREE.Mesh(getGeom('planeWing', () => new THREE.BoxGeometry(0.14, 0.01, 0.06)), material(0xbedbff)); wing.position.y = 0;
      const tail = new THREE.Mesh(getGeom('planeTail', () => new THREE.BoxGeometry(0.04, 0.04, 0.01)), material(0xbedbff)); tail.position.set(-0.08, 0.03, 0);
      g.add(fuselage, wing, tail, glowSprite(0xffffff, 0.16));
      g.rotation.z = Math.PI / 2;
      const light = new THREE.PointLight(0xffffff, 0.4, 1.0); g.add(light); disposables.push(light);
      return g;
    }

    function makeProbe(color = 0xfff6c2) {
      const mesh = new THREE.Mesh(getGeom('probe', () => new THREE.OctahedronGeometry(0.06)), material(color));
      const g = new THREE.Group(); g.add(mesh, glowSprite(0xfff6c2, 0.18)); return g;
    }

    function makeUFO(color = 0xc0f2ff) {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(getGeom('ufoRing', () => new THREE.TorusGeometry(0.08, 0.025, 12, 24)), material(color));
      const dome = new THREE.Mesh(getGeom('ufoDome', () => new THREE.SphereGeometry(0.045, 16, 12)), material(0xffffff)); dome.position.y = 0.03;
      g.add(ring, dome, glowSprite(0xcaf7ff, 0.22));
      const light = new THREE.PointLight(0xcaf7ff, 0.5, 1.2); g.add(light); disposables.push(light);
      return g;
    }

    function makeDish(color = 0xa8d8ff) {
      const g = new THREE.Group();
      const dish = new THREE.Mesh(getGeom('dish', () => new THREE.ConeGeometry(0.08, 0.06, 16, 1, true)), material(color));
      dish.rotation.z = Math.PI; dish.rotation.x = -Math.PI / 4; dish.position.y = 0.02;
      const stem = new THREE.Mesh(getGeom('dishStem', () => new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8)), material(0x8fbfff)); stem.position.y = -0.04;
      g.add(dish, stem, glowSprite(0xa8d8ff, 0.16));
      return g;
    }

    function makeDrone(color = 0xffd7a8) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(getGeom('droneBody', () => new THREE.TetrahedronGeometry(0.06)), material(color));
      const bar = new THREE.Mesh(getGeom('droneBar', () => new THREE.CylinderGeometry(0.006, 0.006, 0.18, 8)), material(0xffe3bf));
      g.add(body, bar, glowSprite(0xffe3bf, 0.16));
      return g;
    }

    const makers = [makeRocket, makeSatellite, makePlane, makeProbe, makeUFO, makeDish, makeDrone];

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
          const res = await fetch(url, { cache: "force-cache" });
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

      for (const f of data.features) {
        const geom = f.geometry;
        if (!geom) continue;
        if (geom.type === "Polygon") {
          const coords = geom.coordinates; // [rings][points][lon,lat]
          if (coords[0]) pushRing(coords[0]); // outer ring only for minimal look
        } else if (geom.type === "MultiPolygon") {
          const polys = geom.coordinates;
          for (const poly of polys) if (poly[0]) pushRing(poly[0]);
        }
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

    // Orbits + 3D satellites with evenly distributed orbit planes (Fibonacci sphere normals)
    const satCount = 7;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const sats: { plane: THREE.Object3D; rotator: THREE.Object3D; node: THREE.Object3D; speed: number; spin: number }[] = [];
    for (let i = 0; i < satCount; i++) {
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
      const orbit = new THREE.RingGeometry(radius - 0.001, radius + 0.001, 128);
      const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
      const orbitMesh = new THREE.Mesh(orbit, orbitMat);
      orbitMesh.rotation.x = 0; // stays in XY for plane local space
      orbitMesh.quaternion.copy(new THREE.Quaternion()); // identity in plane space
      plane.add(orbitMesh);
      disposables.push(orbit, orbitMat);

      // Rotator spins around plane's local Z (which equals world 'normal')
      const rotator = new THREE.Object3D();
      plane.add(rotator);

      const maker = makers[i % makers.length];
      const node = maker();
      node.position.set(radius, 0, 0); // on X axis of the plane's XY ring
      rotator.add(node);

      sats.push({ plane, rotator, node, speed: 0.35 + (i % 6) * 0.08, spin: 0.01 + (i % 5) * 0.004 });
    }

    // Animation loop
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      // Spin the whole Earth system (surface, atmosphere, borders)
      earthGroup.rotation.y += 0.0012;
      stars.rotation.y += 0.0005;

      sats.forEach((s) => {
        s.rotator.rotation.z += s.speed * 0.01; // rotate around plane normal
        s.node.rotation.y += s.spin;
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

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      // dispose helper resources
      Object.values(geoms).forEach(() => {});
      disposables.forEach((d) => {
        if (d.dispose) d.dispose();
      });
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
