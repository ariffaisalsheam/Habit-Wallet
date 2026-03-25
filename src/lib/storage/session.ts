import { STORAGE_KEYS } from "@/lib/storage/keys";

export type LocalUserSession = {
  user_id: string;
  email: string;
  name: string;
  auth_timestamp: number;
};

function isClient() {
  return typeof window !== "undefined";
}

export function getStoredUserSession() {
  if (!isClient()) {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.userSession);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as LocalUserSession;
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEYS.userSession);
    return null;
  }
}

export function saveUserSession(session: LocalUserSession) {
  if (!isClient()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.userSession, JSON.stringify(session));
}

export function clearUserSession() {
  if (!isClient()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.userSession);
}
