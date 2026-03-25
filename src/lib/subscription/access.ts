import { STORAGE_KEYS } from "@/lib/storage/keys";

export const CLOUD_SYNC_LOCK_MESSAGE =
  "Cloud sync is a Professional feature. Upgrade to enable device sync.";

function isClient() {
  return typeof window !== "undefined";
}

function getSessionUserId() {
  if (!isClient()) return null;

  const raw = window.localStorage.getItem(STORAGE_KEYS.userSession);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { user_id?: string };
    return parsed.user_id ?? null;
  } catch {
    return null;
  }
}

export function getCurrentUserTierFromCache(): "free" | "pro" {
  if (!isClient()) return "free";
  const userId = getSessionUserId();
  if (!userId) return "free";

  const raw = window.localStorage.getItem(`${STORAGE_KEYS.profileCachePrefix}${userId}`);
  if (!raw) return "free";

  try {
    const parsed = JSON.parse(raw) as { subscriptionTier?: string };
    return parsed.subscriptionTier === "pro" ? "pro" : "free";
  } catch {
    return "free";
  }
}

export function isCloudSyncEnabledForCurrentUser() {
  return getCurrentUserTierFromCache() === "pro";
}

export function assertCloudSyncAccess() {
  if (!isCloudSyncEnabledForCurrentUser()) {
    throw new Error(CLOUD_SYNC_LOCK_MESSAGE);
  }
}

export function isCloudSyncLockedError(error: unknown) {
  return error instanceof Error && error.message === CLOUD_SYNC_LOCK_MESSAGE;
}
