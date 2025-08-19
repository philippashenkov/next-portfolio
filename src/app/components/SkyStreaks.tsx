"use client";
import { useEffect, useRef } from "react";

type Spark = {
	x: number;
	y: number;
	px: number;
	py: number;
	vx: number;
	vy: number;
	life: number;
	ttl: number; // seconds
	width: number;
	hue: number;
};

export default function SkyStreaks() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number | null>(null);
	const spawnTimerRef = useRef<number | null>(null);
	const runningRef = useRef(true);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { alpha: true })!;

		const prefersReduce = typeof window !== "undefined" &&
			window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		let dpr = Math.min(window.devicePixelRatio || 1, 2);
		const resize = () => {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			const w = window.innerWidth;
			const h = window.innerHeight;
			canvas.style.width = w + "px";
			canvas.style.height = h + "px";
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		resize();

		const sparks: Spark[] = [];
		const MAX_CONCURRENT = prefersReduce ? 0 : 3; // accessibility friendly

		const spawn = () => {
			if (!runningRef.current || prefersReduce) return;
			if (sparks.length < MAX_CONCURRENT) {
				const w = window.innerWidth;
				const h = window.innerHeight;
				// start from random edge
				const edge = Math.floor(Math.random() * 4);
				const margin = Math.max(w, h) * 0.15;
				let x = 0, y = 0;
				if (edge === 0) { x = -margin; y = Math.random() * h; }
				else if (edge === 1) { x = w + margin; y = Math.random() * h; }
				else if (edge === 2) { x = Math.random() * w; y = -margin; }
				else { x = Math.random() * w; y = h + margin; }
				// speed and direction
				const angle = Math.random() * Math.PI * 2;
				const speed = 700 + Math.random() * 900; // px/s
				const jitter = (Math.random() * 0.25 + 0.15); // for electric wobble
				const vx = Math.cos(angle) * speed;
				const vy = Math.sin(angle) * speed;
				const ttl = 0.6 + Math.random() * 1.1;
				const width = 0.8 + Math.random() * 1.4;
				const hue = 195 + Math.random() * 30; // blue/cyan range
				sparks.push({ x, y, px: x, py: y, vx: vx * (1 + jitter), vy: vy * (1 - jitter), life: 0, ttl, width, hue });
			}
			// spawn between 2–5 seconds
			spawnTimerRef.current = window.setTimeout(spawn, 2000 + Math.random() * 3000);
		};
		spawn();

		let last = performance.now();
		const loop = () => {
			const now = performance.now();
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;

			// fade previous frame to create persistent trails
			ctx.save();
			ctx.globalCompositeOperation = "destination-out";
			ctx.globalAlpha = 0.10; // trail fade
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.restore();

			ctx.save();
			ctx.globalCompositeOperation = "lighter"; // glow
			for (let i = sparks.length - 1; i >= 0; i--) {
				const s = sparks[i];
				s.life += dt;
				// jitter direction for electric feel
				const turn = (Math.random() - 0.5) * 0.35; // radians per frame
				const cos = Math.cos(turn), sin = Math.sin(turn);
				const nvx = s.vx * cos - s.vy * sin;
				const nvy = s.vx * sin + s.vy * cos;
				s.vx = nvx; s.vy = nvy;

				s.px = s.x; s.py = s.y;
				s.x += s.vx * dt;
				s.y += s.vy * dt;

				const t = 1 - Math.min(1, s.life / s.ttl);
				const alpha = Math.pow(t, 0.6);

				// stroke
				ctx.lineWidth = s.width;
				const grad = ctx.createLinearGradient(s.px, s.py, s.x, s.y);
				grad.addColorStop(0, `hsla(${s.hue}, 100%, 85%, ${alpha * 0.25})`);
				grad.addColorStop(1, `hsla(${s.hue}, 100%, 55%, ${alpha})`);
				ctx.strokeStyle = grad;
				ctx.shadowColor = `hsla(${s.hue}, 100%, 70%, ${alpha})`;
				ctx.shadowBlur = 12;
				ctx.beginPath();
				ctx.moveTo(s.px, s.py);
				ctx.lineTo(s.x, s.y);
				ctx.stroke();

				// head spark
				ctx.fillStyle = `hsla(${s.hue}, 100%, 92%, ${alpha})`;
				ctx.beginPath();
				ctx.arc(s.x, s.y, 1.4 * s.width, 0, Math.PI * 2);
				ctx.fill();

				if (s.life >= s.ttl) {
					sparks.splice(i, 1);
				}
			}
			ctx.restore();

			if (runningRef.current) rafRef.current = requestAnimationFrame(loop);
		};
		rafRef.current = requestAnimationFrame(loop);

		const onVis = () => {
			runningRef.current = document.visibilityState === "visible";
			if (runningRef.current && !prefersReduce) {
				last = performance.now();
				if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
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
		<canvas
			ref={canvasRef}
			aria-hidden
			style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 3 }}
		/>
	);
}

