"use client";
import { useEffect, useRef } from "react";

type Spark = {
  x: number; y: number;
  px: number; py: number;
  vx: number; vy: number;
  life: number;
  ttl: number;      // seconds
  width: number;
};

type ThemeVars = {
  core: string;     // hex or css color
  main: string;
  edge: string;
  glow: string;
  opacity: number;  // 0..1
  bloom: number;    // 0..2+
  mode: "light" | "dark" | "unknown";
};

function readTheme(): ThemeVars {
  const el = document.documentElement;
  const cs = getComputedStyle(el);
  const get = (v: string, d = "") => (cs.getPropertyValue(v).trim() || d);
  const toNum = (v: string, d: number) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : d;
  };
  const modeAttr = (el.getAttribute("data-theme") || "").toLowerCase();
  const mode: ThemeVars["mode"] =
    modeAttr === "light" || modeAttr === "dark" ? (modeAttr as ThemeVars["mode"]) : "unknown";
  return {
    core: get("--streak-core", "#fff6dd"),
    main: get("--streak-main", "#ff6a00"),
    edge: get("--streak-edge", "#ff2d00"),
    glow: get("--streak-glow", "#ff67f2ff"),
    opacity: toNum(get("--streak-opacity"), 0.88),
    bloom: toNum(get("--streak-bloom"), 1.2),
    mode,
  };
}

function hexToRgb(col: string): { r: number; g: number; b: number } {
  // Supports #rgb, #rrggbb, rgb(), hsl() passthrough via canvas
  if (col.startsWith("#")) {
    let hex = col.slice(1);
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  // Fallback parse via offscreen canvas (handles named/rgb/hsl)
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return { r: 255, g: 255, b: 255 };
  ctx.fillStyle = col;
  const computed = ctx.fillStyle as string;
  // computed should be rgb(a)
  const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  return { r: 255, g: 255, b: 255 };
}

function withAlpha(col: string, a: number): string {
  const { r, g, b } = hexToRgb(col);
  const alpha = Math.max(0, Math.min(1, a));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function SkyStreaks() {
  const trailRef = useRef<HTMLCanvasElement>(null);
  const headRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const runningRef = useRef(true);
  const themeRef = useRef<ThemeVars | null>(null);

  useEffect(() => {
    const trailCanvas = trailRef.current;
    const headCanvas = headRef.current;
    if (!trailCanvas || !headCanvas) return;

    const trail = trailCanvas.getContext("2d", { alpha: true });
    const head = headCanvas.getContext("2d", { alpha: true });
    if (!trail || !head) return;

    themeRef.current = readTheme();
    const observer = new MutationObserver(() => {
      themeRef.current = readTheme();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const prefersReduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Настройки в зависимости от темы
    const getCfg = () => {
      const t = themeRef.current!;
      const isLight = t.mode === "light" || t.mode === "unknown"; // default: ярко
      return {
        USE_ADDITIVE_TAIL: true,                 // яркий “огненный” хвост
        TAIL_SEC: isLight ? 0.09 : 0.08,         // чуть длиннее в светлой
        TAIL_MIN: isLight ? 15 : 8,
        TAIL_MAX: isLight ? 46 : 28,
        HEAD_RADIUS_SCALE: isLight ? 0.9 : 0.7,  // больше “головка” в светлой теме
        TRAIL_SHADOW: isLight ? 14 : 8,          // усиленная “отблеск”
      } as const;
    };

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth, h = window.innerHeight;

    const applySize = (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      c.style.width = w + "px";
      c.style.height = h + "px";
      c.width = Math.max(1, Math.floor(w * dpr));
      c.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // рисуем в CSS-пикселях
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      applySize(trailCanvas, trail);
      applySize(headCanvas, head);
    };
    resize();

    const sparks: Spark[] = [];
    const MAX_CONCURRENT = prefersReduce ? 2 : 6;

    const spawn = () => {
      const delay = prefersReduce ? 800 + Math.random() * 800 : 450 + Math.random() * 500;
      if (runningRef.current && sparks.length < MAX_CONCURRENT) {
        // старт с края
        const edge = Math.floor(Math.random() * 4);
        const margin = Math.max(w, h) * 0.15;
        let x = 0, y = 0;
        if (edge === 0) { x = -margin; y = Math.random() * h; }
        else if (edge === 1) { x = w + margin; y = Math.random() * h; }
        else if (edge === 2) { x = Math.random() * w; y = -margin; }
        else { x = Math.random() * w; y = h + margin; }

        const angle = Math.random() * Math.PI * 2;
        const baseSpeed = prefersReduce ? 500 : 700;
        const speed = baseSpeed + Math.random() * (prefersReduce ? 500 : 900);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const ttl = (prefersReduce ? 0.6 : 0.7) + Math.random() * (prefersReduce ? 0.8 : 1.1);
        const width = (prefersReduce ? 0.7 : 0.9) + Math.random() * 1.6;
        sparks.push({ x, y, px: x, py: y, vx, vy, life: 0, ttl, width });
      }
      spawnTimerRef.current = window.setTimeout(spawn, delay);
    };
    spawn();

    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const theme = themeRef.current || readTheme();
      const cfg = getCfg();

      // Полное очищение обоих слоёв каждый кадр
      // trail
      trail.save();
      trail.setTransform(1, 0, 0, 1, 0, 0);
      trail.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      trail.restore();
      trail.setTransform(dpr, 0, 0, dpr, 0, 0);

      // heads
      head.save();
      head.setTransform(1, 0, 0, 1, 0, 0);
      head.clearRect(0, 0, headCanvas.width, headCanvas.height);
      head.restore();
      head.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Рисуем кометы
      trail.save();
      trail.globalCompositeOperation = cfg.USE_ADDITIVE_TAIL ? "lighter" : "source-over";
      head.save();
      head.globalCompositeOperation = "lighter";

      const opa = theme.opacity;
      const bloom = theme.bloom;

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;

        s.px = s.x; s.py = s.y;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const t = 1 - Math.min(1, s.life / s.ttl);
        const alpha = Math.pow(t, 0.6) * opa;

        // КОРОТКИЙ ЯРКИЙ ХВОСТ
        const speed = Math.hypot(s.vx, s.vy);
        const nx = s.vx / (speed || 1);
        const ny = s.vy / (speed || 1);
        const tailLen = Math.max(cfg.TAIL_MIN, Math.min(cfg.TAIL_MAX, speed * cfg.TAIL_SEC));
        const x0 = s.x - nx * tailLen;
        const y0 = s.y - ny * tailLen;

        const grad = trail.createLinearGradient(x0, y0, s.x, s.y);
        // прозрачное начало → основная “огненная” → горячая кромка
        grad.addColorStop(0.00, withAlpha(theme.main, 0.00));
        grad.addColorStop(0.55, withAlpha(theme.main, Math.min(0.38, alpha * 0.45)));
        grad.addColorStop(0.86, withAlpha(theme.edge, Math.min(0.85, alpha * 0.9)));
        grad.addColorStop(1.00, withAlpha(theme.edge, Math.min(1.0, alpha)));

        trail.strokeStyle = grad;
        trail.lineCap = "round";
        trail.lineJoin = "round";
        trail.lineWidth = s.width * (theme.mode === "dark" ? 1.6 : 2.0);
        trail.shadowColor = withAlpha(theme.glow, Math.min(0.7, alpha * 0.7));
        trail.shadowBlur = cfg.TRAIL_SHADOW * bloom;

        trail.beginPath();
        trail.moveTo(x0, y0);
        trail.lineTo(s.x, s.y);
        trail.stroke();

        // ГОЛОВКА С ЯДРОМ И ГАЛО
        const headR = Math.max(0.7, s.width * cfg.HEAD_RADIUS_SCALE);
        const glowR = headR * (2.8 + bloom * 0.6);

        // внешнее гало
        const g2 = head.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
        g2.addColorStop(0, withAlpha(theme.core, Math.min(1.0, alpha)));
        g2.addColorStop(1, withAlpha(theme.glow, 0));
        head.fillStyle = g2;
        head.shadowColor = withAlpha(theme.glow, Math.min(0.9, alpha));
        head.shadowBlur = 9 + bloom * 8;
        head.beginPath();
        head.arc(s.x, s.y, headR, 0, Math.PI * 2);
        head.fill();

        // маленькое “ядро” для контраста
        head.shadowBlur = 0;
        head.fillStyle = withAlpha(theme.core, Math.min(1.0, alpha));
        head.beginPath();
        head.arc(s.x, s.y, Math.max(0.4, headR * 0.55), 0, Math.PI * 2);
        head.fill();

        if (s.life >= s.ttl) sparks.splice(i, 1);
      }

      head.restore();
      trail.restore();

      if (runningRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(loop);

    const onVis = () => {
      const visible = document.visibilityState === "visible";
      runningRef.current = visible;
      if (visible) {
        last = performance.now();
        if (rafRef.current == null) rafRef.current = requestAnimationFrame(loop);
        if (spawnTimerRef.current == null) spawn();
      }
    };

    const onResize = () => resize();

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      observer.disconnect();
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <>
      <canvas
        ref={trailRef}
        aria-hidden
        role="presentation"
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 30 }}
      />
      <canvas
        ref={headRef}
        aria-hidden
        role="presentation"
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 31 }}
      />
    </>
  );
}