"use client";

export type AppTheme = "light" | "dark";

const THEME_KEY = "hw_theme";
export const THEME_EVENT = "hft_theme_changed";

const THEME_COLORS: Record<AppTheme, string> = {
  light: "#f5f8f4",
  dark: "#161d20",
};

function canUseDom() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getSystemTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setThemeColorMeta(theme: AppTheme) {
  if (!canUseDom()) {
    return;
  }

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-hw-theme="1"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.setAttribute("data-hw-theme", "1");
    document.head.appendChild(meta);
  }

  meta.content = THEME_COLORS[theme];
}

function setAppleStatusBarMeta(theme: AppTheme) {
  if (!canUseDom()) {
    return;
  }

  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="apple-mobile-web-app-status-bar-style"][data-hw-theme="1"]'
  );

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "apple-mobile-web-app-status-bar-style";
    meta.setAttribute("data-hw-theme", "1");
    document.head.appendChild(meta);
  }

  meta.content = theme === "dark" ? "black-translucent" : "default";
}

export function getStoredTheme(): AppTheme | null {
  if (!canUseDom()) {
    return null;
  }

  const value = window.localStorage.getItem(THEME_KEY);
  return value === "dark" || value === "light" ? value : null;
}

export function getCurrentTheme(): AppTheme {
  if (!canUseDom()) {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function resolveInitialTheme(): AppTheme {
  const stored = getStoredTheme();
  return stored ?? getSystemTheme();
}

export function applyTheme(theme: AppTheme, options?: { persist?: boolean; emit?: boolean }) {
  if (!canUseDom()) {
    return;
  }

  const { persist = true, emit = true } = options ?? {};
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  setThemeColorMeta(theme);
  setAppleStatusBarMeta(theme);

  if (persist) {
    window.localStorage.setItem(THEME_KEY, theme);
  }

  if (emit) {
    window.dispatchEvent(new Event(THEME_EVENT));
  }
}

export function subscribeToTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(THEME_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(THEME_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}
