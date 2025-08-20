"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Topbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const el = document.documentElement;
    const t = (el.getAttribute("data-theme") as "light" | "dark") ?? "light";
    setTheme(t);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
      document.cookie = `theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  };

  return (
    <header data-topbar>
      <div data-brand>
        <Link href="/" aria-label="Home">PA · Portfolio</Link>
      </div>

      <nav data-nav aria-label="Primary">
        <button
          type="button"
          data-btn
          data-theme-btn
          aria-label="Toggle theme"
          aria-pressed={theme === "dark"}
          onClick={toggleTheme}
          title={`Theme: ${theme}`}
        >
          <span aria-hidden>{theme === "light" ? "☀" : "☽"}</span>
          <span data-label style={{ marginLeft: 6 }}>{theme === "light" ? "Light" : "Dark"}</span>
        </button>

        <Link data-btn className="nav-btn" href="/" aria-current={pathname === "/" ? "page" : undefined}>Home</Link>
        <Link data-btn className="nav-btn" href="/about" aria-current={pathname?.startsWith("/about") ? "page" : undefined}>About</Link>
        <Link data-btn className="nav-btn" href="/contact" aria-current={pathname?.startsWith("/contact") ? "page" : undefined}>Contacts</Link>
      </nav>
    </header>
  );
}