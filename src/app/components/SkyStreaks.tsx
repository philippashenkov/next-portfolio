"use client";
import { useEffect, useRef } from "react";

type Spark = {
    x: number; y: number;
    px: number; py: number;
    vx: number; vy: number;
    life: number;
    ttl: number; // seconds
    width: number;
    hue: number;
};

export default function SkyStreaks() {
    const trailRef = useRef<HTMLCanvasElement>(null);
    const headRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const spawnTimerRef = useRef<number | null>(null);
    const runningRef = useRef(true);

    useEffect(() => {
        const trailCanvas = trailRef.current!;
        const headCanvas = headRef.current!;
        const trail = trailCanvas.getContext("2d", { alpha: true })!;
        const head = headCanvas.getContext("2d", { alpha: true })!;

        const prefersReduce = typeof window !== "undefined" &&
            window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Настройки визуала
        const CFG = {
            USE_ADDITIVE_TAIL: false,
            TAIL_SEC: 0.035,          // короче база
            TAIL_MIN: 8,              // короче минимум
            TAIL_MAX: 28,             // короче максимум
            HEAD_RADIUS_SCALE: 0.7,   // чуть больше головка
        } as const;

        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        let w = window.innerWidth, h = window.innerHeight;

        const applySize = (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
            c.style.width = w + "px";
            c.style.height = h + "px";
            c.width = Math.floor(w * dpr);
            c.height = Math.floor(h * dpr);
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
        // Не отключаем полностью при reduce-motion
        const MAX_CONCURRENT = prefersReduce ? 2 : 6;

        const spawn = () => {
            // всегда перепланируем следующий запуск
            const delay = 500 + Math.random() * 500; // ~0.5–1.0 c
            if (runningRef.current && sparks.length < MAX_CONCURRENT) {
                // старт с края
                const edge = Math.floor(Math.random() * 4);
                const margin = Math.max(w, h) * 0.15;
                let x = 0, y = 0;
                if (edge === 0) { x = -margin; y = Math.random() * h; }
                else if (edge === 1) { x = w + margin; y = Math.random() * h; }
                else if (edge === 2) { x = Math.random() * w; y = -margin; }
                else { x = Math.random() * w; y = h + margin; }
                // прямая траектория
                const angle = Math.random() * Math.PI * 2;
                const speed = 700 + Math.random() * 900;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const ttl = 0.6 + Math.random() * 1.1;
                const width = 0.8 + Math.random() * 1.4;
                const hue = 195 + Math.random() * 30;
                sparks.push({ x, y, px: x, py: y, vx, vy, life: 0, ttl, width, hue });
            }
            spawnTimerRef.current = window.setTimeout(spawn, delay);
        };
        spawn();

        let last = performance.now();
        const loop = () => {
            const now = performance.now();
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;

            // Полное очищение обоих слоёв каждый кадр (никаких “следов”)
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
            trail.globalCompositeOperation = CFG.USE_ADDITIVE_TAIL ? "lighter" : "source-over";
            head.save();
            head.globalCompositeOperation = "lighter";

            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.life += dt;

                s.px = s.x; s.py = s.y;
                s.x += s.vx * dt;
                s.y += s.vy * dt;

                const t = 1 - Math.min(1, s.life / s.ttl);
                const alpha = Math.pow(t, 0.6);

                // КОРОТКИЙ ХВОСТ (без накопления)
                const speed = Math.hypot(s.vx, s.vy);
                const tailLen = Math.max(CFG.TAIL_MIN, Math.min(CFG.TAIL_MAX, speed * CFG.TAIL_SEC));
                const nx = s.vx / (speed || 1);
                const ny = s.vy / (speed || 1);
                const x0 = s.x - nx * tailLen;
                const y0 = s.y - ny * tailLen;

                // Один штрих, без blur, заметнее по яркости и толщине
                const grad = trail.createLinearGradient(x0, y0, s.x, s.y);
                grad.addColorStop(0.0, `hsla(${s.hue}, 100%, 65%, 0)`);
                grad.addColorStop(0.6, `hsla(${s.hue}, 100%, 80%, ${alpha * 0.30})`);
                grad.addColorStop(1.0, `hsla(${s.hue}, 100%, 60%, ${alpha})`);
                trail.strokeStyle = grad;
                trail.shadowBlur = 0;
                trail.lineCap = "round";
                trail.lineJoin = "round";
                trail.lineWidth = s.width * 1.7;  // было ~1px → делаем 1.3–2.4px
                trail.beginPath();
                trail.moveTo(x0, y0);
                trail.lineTo(s.x, s.y);
                trail.stroke();

                // МАЛЕНЬКАЯ ГОЛОВКА (очищаемый слой каждый кадр)
                const headR = Math.max(0.6, s.width * CFG.HEAD_RADIUS_SCALE);
                const glowR = headR * 2.4;
                const g2 = head.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
                g2.addColorStop(0, `hsla(${s.hue}, 100%, 98%, ${alpha})`);
                g2.addColorStop(1, `hsla(${s.hue}, 100%, 70%, 0)`);
                head.fillStyle = g2;
                head.shadowColor = `hsla(${s.hue}, 100%, 85%, ${alpha})`;
                head.shadowBlur = 7;
                head.beginPath();
                head.arc(s.x, s.y, headR, 0, Math.PI * 2);
                head.fill();

                if (s.life >= s.ttl) sparks.splice(i, 1);
            }

            head.restore();
            trail.restore();

            if (runningRef.current) {
                rafRef.current = requestAnimationFrame(loop);
            } else {
                // важно: дать onVis шанс перезапустить цикл
                rafRef.current = null;
            }
        };
        rafRef.current = requestAnimationFrame(loop);

        const onVis = () => {
            const visible = document.visibilityState === "visible";
            runningRef.current = visible;
            if (visible) {
                last = performance.now();
                if (rafRef.current == null) {
                    rafRef.current = requestAnimationFrame(loop);
                }
                if (spawnTimerRef.current == null) {
                    spawn(); // перестраховка: восстановить цепочку спавна
                }
            }
        };

        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", onVis);

        return () => {
            runningRef.current = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, []);

    return (
        <>
            <canvas
                ref={trailRef}
                aria-hidden
                style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 30 }}  // выше большинства слоёв
            />
            <canvas
                ref={headRef}
                aria-hidden
                style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 31 }}
            />
        </>
    );
}