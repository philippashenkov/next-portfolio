## Portfolio (Next.js)

Personal portfolio built with Next.js, React, TypeScript, and Three.js. It features a neon retro‑wave theme, a 3D Earth scene, and clean content sections (Home, About, Contact).

### Stack
- Next.js App Router, React 19, TypeScript
- Three.js (custom scene for Earth/starfield)
- CSS (custom globals) + Google fonts (Orbitron/Geist)

### Local development
```bash
npm install
npm run dev
# open http://localhost:3000
```

### Production build
```bash
npm run build
npm start
```

### Deploy
- Vercel (recommended) or any Node host.

### Structure
- `src/app` — routes, layout, global styles
- `src/app/components/ThreeScene.tsx` — 3D scene
- `src/app/components/Navbar.tsx` — header

### Notes
- Replace placeholder links/emails on the Contact page.
- Add case studies/projects as separate routes or MDX content.
