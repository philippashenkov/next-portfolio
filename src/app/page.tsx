import ThreeScene from "./components/ThreeScene";
import Link from "next/link";

export default function Home() {
  return (
    <main className="page" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.2fr 1fr" }}>
      <div style={{ position: "relative" }}>
        <ThreeScene />
      </div>

      <section style={{ display: "flex", alignItems: "center", padding: "2rem" }}>
        <div className="retro-card" style={{ padding: "1.5rem 1.75rem", width: "100%" }}>
          <h1 style={{ fontFamily: "var(--font-orbitron)", fontSize: 36, lineHeight: 1.2 }}>Hi, I’m Philipp</h1>
          <p style={{ marginTop: 12, opacity: 0.9 }}>
            Frontend & Creative Developer. I design and build fast, clean interfaces and rich web graphics with Three.js.
            This website is my living playground and portfolio.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Link href="/about" className="retro-card" style={{ padding: "0.6rem 1rem" }}>About</Link>
            <Link href="/contacts" className="retro-card" style={{ padding: "0.6rem 1rem" }}>Contacts</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
