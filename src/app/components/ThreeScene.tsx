"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Reset for HMR/StrictMode remounts
    while (container.firstChild) container.removeChild(container.firstChild);

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
    });
    const atmosphere = new THREE.Mesh(atmoGeom, atmoMat);
    earthGroup.add(atmosphere);

    // Orbits and satellites
    const satCount = 3;
    const sats: { pivot: THREE.Object3D; mesh: THREE.Mesh; speed: number }[] = [];
    for (let i = 0; i < satCount; i++) {
      const pivot = new THREE.Object3D();
      earthGroup.add(pivot);
      const radius = 2.2 + i * 0.35;
      const orbit = new THREE.RingGeometry(radius - 0.001, radius + 0.001, 128);
      const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true, side: THREE.DoubleSide });
      const orbitMesh = new THREE.Mesh(orbit, orbitMat);
      orbitMesh.rotation.x = Math.PI / 2.5 + i * 0.25;
      scene.add(orbitMesh);

      const satGeom = new THREE.SphereGeometry(0.06 + i * 0.02, 12, 12);
      const satMat = new THREE.MeshStandardMaterial({ color: i % 2 ? 0xffe680 : 0x66ccff, emissive: 0x111111 });
      const sat = new THREE.Mesh(satGeom, satMat);
      sat.position.x = radius;
      // tilt orbit plane a bit
      pivot.rotation.set(0.2 + i * 0.15, 0.1 * i, 0);
      pivot.add(sat);
      sats.push({ pivot, mesh: sat, speed: 0.4 + i * 0.2 });
    }

    // Animation loop
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      earth.rotation.y += 0.0025;
      atmosphere.rotation.y += 0.001;
      stars.rotation.y += 0.0005;
      sats.forEach((s, i) => {
        s.pivot.rotation.y += s.speed * 0.01;
        s.mesh.rotation.y += 0.02 + i * 0.01;
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
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
      renderer.dispose();
      earthGeom.dispose();
      atmoGeom.dispose();
      starsGeom.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "calc(100vh - 64px)" }} />;
}
