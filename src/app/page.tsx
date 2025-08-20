import React from "react";
import ThreeScene from "./components/ThreeScene";
import Typewriter from "./components/Typewriter";

export default function Home() {
  return (
    <main className="page hero">
      <div className="hero__scene">
        <ThreeScene />
      </div>

      <section className="hero__content">
        <div className="retro-card hero__card" style={{ padding: "1.75rem 2rem", width: "100%" }}>
          <h1 style={{ fontFamily: "var(--font-orbitron)", fontSize: 36, lineHeight: 1.2 }}>Hi, I’m Philipp</h1>
          <div style={{ marginTop: 8, opacity: 0.95 }}>Frontend & Creative Developer</div>

          <Typewriter
            className="hero-type"
            lineClassName="hero-type-line"
            speedMsPerChar={8}
            lineDelayMs={120}
            startDelayMs={200}
            cursorStyle="block"
            persistKey="home-hero-v1"
            lines={[
              "> booting interface...",
              "> loading modules: [three.js] [next.js] [signals] [visual-core]",
              "> status: STABLE | latency: LOW | aesthetics: HIGH",
              "",
              "This site is not static.",
              "It’s a living node in the evolving web.",
              "A sandbox. A signal. A zone.",
              "",
              "> Interesting facts from Network Archive [2025.α]",
              "$ echo \"Over the next 15 years, the web will mutate...\"",
              "> +700M new nodes will spawn",
              "> ~400M legacy systems will decay",
              "> :: refactor | redesign | reimagine",
              "",
              "This isn’t just growth.",
              "It’s a tectonic shift in digital culture.",
              "Interfaces will become emotional, interactive, alive.",
              "",
              "[$] This project is not a portfolio.",
              "It’s a transmission.",
              "A fusion of code, aesthetics, and meaning.",
            ]}
          />
        </div>
      </section>
    </main>
  );
}
