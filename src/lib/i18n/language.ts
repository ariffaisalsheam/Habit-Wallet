export type AppLanguage = "en" | "bn";

export const APP_LANGUAGE_KEY = "hw_language";
export const APP_LANGUAGE_EVENT = "hft_language_changed";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredAppLanguage(): AppLanguage {
  if (!canUseStorage()) {
    return "en";
  }

  const value = window.localStorage.getItem(APP_LANGUAGE_KEY);
  return value === "bn" ? "bn" : "en";
}

export function setStoredAppLanguage(language: AppLanguage) {
  if (!canUseStorage()) {
    return;
  }

  const current = window.localStorage.getItem(APP_LANGUAGE_KEY);
  if (current === language) {
    document.documentElement.lang = language;
    return;
  }

  window.localStorage.setItem(APP_LANGUAGE_KEY, language);
  document.documentElement.lang = language;
  window.dispatchEvent(new Event(APP_LANGUAGE_EVENT));
}

export function subscribeToAppLanguage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(APP_LANGUAGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(APP_LANGUAGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}
