"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:scale-105"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}
    </button>
  );
}
