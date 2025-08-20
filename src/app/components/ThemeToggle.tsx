"use client";
import { useEffect, useState } from "react";

type Props = {
  className?: string;
};

const STORAGE_KEY = "theme";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle({ className = "btn btn--toggle" }: Props) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme());

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    const el = document.documentElement;
    el.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
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
    >
      {theme === "dark" ? "☀ Light" : "☽ Dark"}
    </button>
  );
}
