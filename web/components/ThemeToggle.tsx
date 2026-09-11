"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "multiply-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    const systemPrefersLight = window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches;
    const initial = saved ?? (systemPrefersLight ? "light" : "dark");
    setTheme(initial);
    document.documentElement.dataset.theme = initial;

    // Follow system changes live if the person hasn't manually overridden.
    if (!saved) {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const handler = (e: MediaQueryListEvent) => {
        const next = e.matches ? "light" : "dark";
        setTheme(next);
        document.documentElement.dataset.theme = next;
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
    >
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
