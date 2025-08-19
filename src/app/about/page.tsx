export default function AboutPage() {
  return (
    <main className="page" style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem" }}>
      <section className="retro-card" style={{ padding: "1.5rem 1.75rem", marginTop: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-orbitron)", fontSize: 32 }}>About</h1>
        <p style={{ marginTop: 12, opacity: 0.95 }}>
          I’m a frontend engineer focused on interactive experiences and high‑quality UI. I mix strong product sense with
          performance, accessibility, and delightful details. Beyond the UI, I’m comfortable shaping build tooling and delivery pipelines
          so that teams ship faster with confidence.
        </p>
      </section>

      <section className="retro-card" style={{ padding: "1.5rem 1.75rem", marginTop: 16 }}>
        <h2 style={{ fontFamily: "var(--font-orbitron)", fontSize: 24 }}>Technologies</h2>
        <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
          <li><b>React</b> (Hooks, Context, performance patterns), <b>Next.js</b> (App Router, SSR/SSG, ISR).</li>
          <li><b>Vue</b> 3 (Composition API) for component‑driven UIs when projects prefer the Vue ecosystem.</li>
          <li><b>TypeScript</b> across the stack for safer, self‑documenting code.</li>
          <li><b>Three.js</b> and WebGL for real‑time graphics, shaders, and creative interactions.</li>
          <li><b>Node.js</b> for APIs, SSR, tooling and automation; <b>Express</b>/<b>Fastify</b> when needed.</li>
          <li>Styling with CSS/SCSS, CSS‑in‑JS, and design systems. Motion with CSS, <b>Framer Motion</b>, or GSAP.</li>
        </ul>
      </section>

      <section className="retro-card" style={{ padding: "1.5rem 1.75rem", marginTop: 16 }}>
        <h2 style={{ fontFamily: "var(--font-orbitron)", fontSize: 24 }}>Infrastructure</h2>
        <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
          <li>CI/CD with GitHub Actions: build, lint, type‑check, unit tests, preview deployments.</li>
          <li>Cloud & hosting: Vercel/Netlify for Jamstack; Dockerized services on AWS/GCP when required.</li>
          <li>Testing: Jest, Vitest, Playwright/Cypress; storybooks for isolated UI development.</li>
          <li>Monitoring: web vitals, performance budgets, error tracking (Sentry), logging.</li>
        </ul>
      </section>
    </main>
  );
}
