"use client";

import { MoonStar, SunMedium } from "lucide-react";

const THEME_KEY = "hw_theme";

function getCurrentTheme() {
  if (typeof document === "undefined") {
    return "light" as const;
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeToggle() {
  const isDark = getCurrentTheme() === "dark";

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border/70 bg-surface-elevated text-foreground shadow-[var(--card-shadow)] transition duration-300 hover:scale-105 hover:soft-glow-active"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}
    </button>
  );
}
