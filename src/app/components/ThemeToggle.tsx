"use client";
import { useEffect, useState } from "react";

type Props = { className?: string };

const STORAGE_KEY = "theme";
const COOKIE = "theme";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}
function writeCookie(name: string, value: string) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

function resolveInitialTheme(): "light" | "dark" {
  // 1) SSR-установленный атрибут на <html>
  if (typeof document !== "undefined") {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
  }
  // 2) localStorage
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    // 3) системная тема
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return "light";
}

export default function ThemeToggle({ className = "btn btn--toggle" }: Props) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    // Подхватываем тему из DOM/cookie при монтировании
    const fromDom = resolveInitialTheme() ?? (readCookie(COOKIE) as "light" | "dark" | undefined);
    setTheme(fromDom || "light");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = document.documentElement;
    el.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
    writeCookie(COOKIE, theme);
  }, [theme, mounted]);

  if (!mounted) return null;

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={className}
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      data-theme-btn
    >
      {theme === "dark" ? "☀ Light" : "☽ Dark"}
    </button>
  );
}
