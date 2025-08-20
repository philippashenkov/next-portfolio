export default function ContactsPage() {
  return (
    <main className="page" style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
      <section className="retro-card" style={{ padding: "1.5rem 1.75rem", marginTop: "32px" }}>
  <h1 style={{ fontFamily: "var(--font-orbitron)", fontSize: 32 }}>Contact</h1>
        <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
            <li>
            Email: <a href="mailto:philpashenko@gmail.com">philpashenko@gmail.com</a>
            </li>
            <li>
            Telegram: <a href="https://t.me/Phil_Green" target="_blank" rel="noopener noreferrer">@Phil_Green</a>
            </li>
            <li>
            GitHub: <a href="https://github.com/philippashenkov" target="_blank" rel="noopener noreferrer">github.com/philippashenkov</a>
            </li>
        </ul>
      </section>
    </main>
  );
}
