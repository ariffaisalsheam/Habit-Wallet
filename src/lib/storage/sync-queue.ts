"use client";

import { STORAGE_KEYS } from "@/lib/storage/keys";

export type SyncCollection = "transactions" | "budgets" | "habits" | "habit-completions";

export type SyncOperation = "create" | "update" | "delete" | "upsert" | "toggle";

export type SyncQueueItem = {
  id: string;
  collection: SyncCollection;
  operation: SyncOperation;
  payload: unknown;
  queuedAt: string;
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  lastError?: string;
  dedupeKey?: string;
};

export const LAST_SYNC_EVENT = "hft_last_sync_changed";

const MAX_QUEUE_ITEMS = 500;
const MAX_SYNC_ATTEMPTS = 8;
const RETRY_BASE_DELAY_MS = 8_000;
const RETRY_MAX_DELAY_MS = 6 * 60 * 60 * 1000;

function canUseStorage() {
  return typeof window !== "undefined";
}

function safeParseQueue(raw: string | null): SyncQueueItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is SyncQueueItem => {
      if (!item || typeof item !== "object") {
        return false;
      }

      return (
        typeof item.id === "string" &&
        typeof item.collection === "string" &&
        typeof item.operation === "string" &&
        typeof item.queuedAt === "string" &&
        typeof item.attempts === "number" &&
        (typeof item.lastAttemptAt === "undefined" || typeof item.lastAttemptAt === "string") &&
        (typeof item.nextRetryAt === "undefined" || typeof item.nextRetryAt === "string") &&
        (typeof item.lastError === "undefined" || typeof item.lastError === "string")
      );
    });
  } catch {
    return [];
  }
}

function getRetryDelayMs(attempts: number) {
  const exponent = Math.max(0, attempts - 1);
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.min(RETRY_BASE_DELAY_MS * 2 ** exponent * jitter, RETRY_MAX_DELAY_MS);
}

function writeQueue(queue: SyncQueueItem[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.syncQueue, JSON.stringify(queue));
}

export function readSyncQueue() {
  if (!canUseStorage()) {
    return [] as SyncQueueItem[];
  }

  return safeParseQueue(window.localStorage.getItem(STORAGE_KEYS.syncQueue));
}

export function getSyncQueueByCollection(collection: SyncCollection) {
  return readSyncQueue().filter((item) => item.collection === collection);
}

export function getSyncQueueCount(collection?: SyncCollection) {
  if (!collection) {
    return readSyncQueue().length;
  }

  return getSyncQueueByCollection(collection).length;
}

export function getRetryableSyncOperations(collection: SyncCollection, limit = 25) {
  const now = Date.now();

  return getSyncQueueByCollection(collection)
    .filter((item) => {
      if (item.attempts >= MAX_SYNC_ATTEMPTS) {
        return false;
      }

      if (!item.nextRetryAt) {
        return true;
      }

      const retryAt = Date.parse(item.nextRetryAt);
      if (Number.isNaN(retryAt)) {
        return true;
      }

      return retryAt <= now;
    })
    .slice(0, limit);
}

export function getDeferredSyncCount(collection?: SyncCollection) {
  const now = Date.now();
  const queue = collection ? getSyncQueueByCollection(collection) : readSyncQueue();

  return queue.filter((item) => {
    if (item.attempts >= MAX_SYNC_ATTEMPTS) {
      return true;
    }

    if (!item.nextRetryAt) {
      return false;
    }

    const retryAt = Date.parse(item.nextRetryAt);
    return !Number.isNaN(retryAt) && retryAt > now;
  }).length;
}

export function hasQueuedDedupeKey(dedupeKey: string) {
  return readSyncQueue().some((item) => item.dedupeKey === dedupeKey);
}

export function enqueueSyncOperation(
  item: Omit<SyncQueueItem, "id" | "queuedAt" | "attempts">
) {
  const queue = readSyncQueue();
  const withoutDuplicate = item.dedupeKey
    ? queue.filter((queued) => queued.dedupeKey !== item.dedupeKey)
    : queue;

  const nextItem: SyncQueueItem = {
    id: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    attempts: 0,
    ...item,
  };

  const nextQueue = [...withoutDuplicate, nextItem].slice(-MAX_QUEUE_ITEMS);
  writeQueue(nextQueue);
  return nextItem;
}

export function removeSyncOperation(id: string) {
  const queue = readSyncQueue();
  const nextQueue = queue.filter((item) => item.id !== id);
  writeQueue(nextQueue);
}

export function removeSyncByDedupeKey(dedupeKey: string) {
  const queue = readSyncQueue();
  const nextQueue = queue.filter((item) => item.dedupeKey !== dedupeKey);
  writeQueue(nextQueue);
}

export function removeSyncByDedupePrefix(prefix: string) {
  const queue = readSyncQueue();
  const nextQueue = queue.filter((item) => !(item.dedupeKey && item.dedupeKey.startsWith(prefix)));
  writeQueue(nextQueue);
}

export function markSyncAttempt(id: string) {
  const queue = readSyncQueue();
  const nextQueue = queue.map((item) =>
    item.id === id
      ? {
          ...item,
          attempts: item.attempts + 1,
          lastAttemptAt: new Date().toISOString(),
        }
      : item
  );

  writeQueue(nextQueue);
}

export function markSyncFailure(id: string, message: string) {
  const queue = readSyncQueue();
  const nextQueue = queue.map((item) => {
    if (item.id !== id) {
      return item;
    }

    if (item.attempts >= MAX_SYNC_ATTEMPTS) {
      return {
        ...item,
        nextRetryAt: undefined,
        lastError: message,
      };
    }

    return {
      ...item,
      nextRetryAt: new Date(Date.now() + getRetryDelayMs(item.attempts)).toISOString(),
      lastError: message,
    };
  });

  writeQueue(nextQueue);
}

export function setLastSyncNow() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.lastSync, new Date().toISOString());
  window.dispatchEvent(new Event(LAST_SYNC_EVENT));
}

export function getLastSyncAt() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEYS.lastSync);
}
