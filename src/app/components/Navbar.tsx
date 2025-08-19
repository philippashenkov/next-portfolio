"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        prefetch
        style={{
          padding: "8px 14px",
          borderRadius: 999,
          color: active ? "#fff" : "rgba(255,255,255,0.9)",
          background: active ? "rgba(255,255,255,0.15)" : "transparent",
          transition: "all 0.2s ease",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0.6rem 1rem",
          color: "#fff",
        }}
      >
        <Link href="/" style={{ color: "#fff", fontWeight: 700, fontFamily: "var(--font-orbitron)", letterSpacing: 1 }}>
          PA • Portfolio
        </Link>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <NavLink href="/" label="Home" />
          <NavLink href="/about" label="About" />
          <NavLink href="/contacts" label="Contacts" />
        </div>
      </nav>
    </header>
  );
}
