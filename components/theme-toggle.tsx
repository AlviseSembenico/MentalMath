"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "mmath-theme";

const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
};

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "dark";
  }

  return "dark";
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initialTheme = getStoredTheme() ?? getPreferredTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setHydrated(true);
  }, []);

  const handleToggle = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Toggle theme"
      aria-pressed={theme === "dark"}
      disabled={!hydrated}
      className="flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:border-zinc-500"
    >
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs"
        aria-hidden="true"
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}