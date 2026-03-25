import { STORAGE_KEYS } from "@/lib/storage/keys";

export type LocalUserSession = {
  user_id: string;
  email: string;
  name: string;
  labels: string[];
  is_admin: boolean;
  email_verified: boolean;
  auth_timestamp: number;
};

export const USER_SESSION_EVENT = "hft_user_session_changed";

let cachedSessionRaw: string | null | undefined;
let cachedSession: LocalUserSession | null = null;

function isClient() {
  return typeof window !== "undefined";
}

function setGuardCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 7;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
}

function clearGuardCookie(name: string) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax${secure}`;
}

function notifySessionChange() {
  if (!isClient()) {
    return;
  }

  window.dispatchEvent(new Event(USER_SESSION_EVENT));
}

export function getStoredUserSession() {
  if (!isClient()) {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.userSession);
  if (raw === cachedSessionRaw) {
    return cachedSession;
  }

  cachedSessionRaw = raw;

  if (!raw) {
    cachedSession = null;
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalUserSession>;

    if (!parsed.user_id || !parsed.email || !parsed.name || !parsed.auth_timestamp) {
      window.localStorage.removeItem(STORAGE_KEYS.userSession);
      cachedSessionRaw = null;
      cachedSession = null;
      return null;
    }

    cachedSession = {
      user_id: parsed.user_id,
      email: parsed.email,
      name: parsed.name,
      labels: Array.isArray(parsed.labels)
        ? parsed.labels.filter((item): item is string => typeof item === "string")
        : [],
      is_admin: Boolean(parsed.is_admin),
      email_verified: Boolean(parsed.email_verified),
      auth_timestamp: parsed.auth_timestamp,
    };

    return cachedSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEYS.userSession);
    cachedSessionRaw = null;
    cachedSession = null;
    return null;
  }
}

export function saveUserSession(session: LocalUserSession) {
  if (!isClient()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.userSession, JSON.stringify(session));
  setGuardCookie("hw_session", "1");
  setGuardCookie("hw_admin", session.is_admin ? "1" : "0");
  cachedSessionRaw = undefined;
  notifySessionChange();
}

export function clearUserSession() {
  if (!isClient()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.userSession);
  clearGuardCookie("hw_session");
  clearGuardCookie("hw_admin");
  cachedSessionRaw = undefined;
  cachedSession = null;
  notifySessionChange();
}
