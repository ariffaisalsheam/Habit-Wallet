"use client";

import { useSyncExternalStore } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import {
  applyTheme,
  getCurrentTheme,
  subscribeToTheme,
  type AppTheme,
} from "@/lib/theme/client";

export function ThemeToggle() {
  const theme = useSyncExternalStore<AppTheme>(subscribeToTheme, getCurrentTheme, () => "light");
  const isDark = theme === "dark";

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
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
