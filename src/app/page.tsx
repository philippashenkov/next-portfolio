import ThreeScene from "./components/ThreeScene";

export default function Home() {
  return (
    <main className="page" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.2fr 1fr" }}>
      <div style={{ position: "relative" }}>
        <ThreeScene />
      </div>

      <section style={{ display: "flex", alignItems: "center", padding: "2rem" }}>
        <div className="retro-card" style={{ padding: "1.75rem 2rem", width: "100%" }}>
          <h1 style={{ fontFamily: "var(--font-orbitron)", fontSize: 36, lineHeight: 1.2 }}>Hi, I’m Philipp</h1>
          <p style={{ marginTop: 12, opacity: 0.9 }}>
            Frontend & Creative Developer. I design and build fast, clean interfaces and rich web graphics with Three.js.
            This website is my living playground and portfolio.
          </p>
          <div style={{ marginTop: 18, fontFamily: "var(--font-orbitron)", fontSize: 12, letterSpacing: 1, opacity: 0.9 }}>🧠 Interesting facts from Network Archive [2025.α]</div>
          <p style={{ marginTop: 8, opacity: 0.9, lineHeight: 1.5 }}>
            Over the next 15 years, the global web will spawn more than 700 million new nodes — sites, interfaces, digital realms. Simultaneously, hundreds of millions of existing structures will begin to decay, demanding refactoring, redesign, and reinvention. This isn’t just growth. It’s a tectonic shift in the visual culture of the internet. An era where interfaces become emotional, interactive, and alive. This project is not just a website. It’s an artifact of a new epoch — a fusion of code, aesthetics, and meaning, flowing through one interface. Welcome to the zone where pixels tell stories.
          </p>
        </div>
      </section>
    </main>
  );
}
