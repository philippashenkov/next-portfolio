"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname() || "/";

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    const cls = `btn nav-btn${active ? " btn--active" : ""}`;
    return (
      <Link
        href={href}
        prefetch
        className={cls}
        aria-current={active ? "page" : undefined}
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
        borderBottom: "1px solid var(--border)",
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
          color: "var(--header-fg)",
        }}
      >
                <ThemeToggle />
        <Link
          href="/"
          style={{
            color: "var(--header-fg)",
            fontWeight: 700,
            fontFamily: "var(--font-orbitron)",
            letterSpacing: 1,
          }}
        >
          PA • Portfolio
        </Link>

        {/* Кнопка переключения темы — внутри компонента желательно задать className="btn" */}

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <NavLink href="/" label="Home" />
          <NavLink href="/about" label="About" />
          <NavLink href="/contacts" label="Contacts" />
        </div>
      </nav>
    </header>
  );
}
