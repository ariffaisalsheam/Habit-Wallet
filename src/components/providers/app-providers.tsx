"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Image from "next/image";
import { client } from "@/lib/appwrite";
import { useBudgetsStore } from "@/features/finance/store/use-budgets-store";
import { useTransactionsStore } from "@/features/finance/store/use-transactions-store";
import { useHabitsStore } from "@/features/habits/store/use-habits-store";
import { getSyncQueueCount, setLastSyncNow } from "@/lib/storage/sync-queue";
import { isCloudSyncEnabledForCurrentUser } from "@/lib/subscription/access";
import { getStoredAppLanguage } from "@/lib/i18n/language";
import { applyTheme, resolveInitialTheme } from "@/lib/theme/client";

type AppProvidersProps = {
  children: ReactNode;
};

const BOOT_MESSAGES = [
  "Warming up your dashboards...",
  "Preparing habits and finance data...",
  "Optimizing offline workspace...",
];

function applyInitialTheme() {
  applyTheme(resolveInitialTheme(), { persist: false, emit: false });
}

function applyInitialLanguage() {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = getStoredAppLanguage();
}

export function AppProviders({ children }: AppProvidersProps) {
  const syncTransactions = useTransactionsStore((state) => state.syncPending);
  const syncBudgets = useBudgetsStore((state) => state.syncPending);
  const syncHabits = useHabitsStore((state) => state.syncPending);
  const syncInFlightRef = useRef(false);
  const lastSyncRunAtRef = useRef(0);
  const [booting, setBooting] = useState(true);
  const [bootMessageIndex, setBootMessageIndex] = useState(0);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    applyInitialTheme();
    applyInitialLanguage();

    const startedAt = Date.now();
    const messageInterval = window.setInterval(() => {
      setBootMessageIndex((value) => (value + 1) % BOOT_MESSAGES.length);
    }, 850);

    const finishBoot = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 420 - elapsed);
      window.setTimeout(() => setBooting(false), remaining);
    };

    const hasRequestIdleCallback =
      typeof window !== "undefined" && typeof window.requestIdleCallback === "function";

    if (hasRequestIdleCallback) {
      window.requestIdleCallback(finishBoot, { timeout: 900 });
    } else {
      globalThis.setTimeout(finishBoot, 320);
    }

    const pingTimeout = window.setTimeout(() => {
      void client.ping().catch(() => {
        // Keep startup resilient if ping fails temporarily.
      });
    }, 1200);

    const runSync = (force = false) => {
      if (!isCloudSyncEnabledForCurrentUser()) {
        return;
      }

      const pendingChanges = getSyncQueueCount();
      if (pendingChanges === 0) {
        setLastSyncNow();
        return;
      }

      if (!force && Date.now() - lastSyncRunAtRef.current < 15_000) {
        return;
      }

      if (syncInFlightRef.current) {
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      syncInFlightRef.current = true;
      lastSyncRunAtRef.current = Date.now();

      void Promise.allSettled([syncTransactions(), syncBudgets(), syncHabits()]).finally(() => {
        syncInFlightRef.current = false;
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => runSync(true), { timeout: 2500 });
      void idleId;
    } else {
      globalThis.setTimeout(() => runSync(true), 900);
    }

    const interval = globalThis.setInterval(runSync, 5 * 60 * 1000);

    const onOnline = () => runSync(true);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        runSync(true);
      }
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(pingTimeout);
      window.clearInterval(messageInterval);
      globalThis.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncBudgets, syncHabits, syncTransactions]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {booting ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/92 backdrop-blur-sm">
          <div className="flex w-[min(90vw,22rem)] flex-col items-center rounded-3xl border border-border/70 bg-surface/90 px-5 py-6 shadow-[var(--soft-shadow)]">
            <Image
              src="/logo/android-chrome-512x512.png"
              alt="HabitWallet logo"
              width={66}
              height={66}
              className="animate-breathe rounded-2xl"
              priority
            />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              HabitWallet
            </p>
            <p className="mt-2 h-5 text-center text-sm font-medium text-foreground/90 transition-all">
              {BOOT_MESSAGES[bootMessageIndex]}
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border/70">
              <span
                className="block h-full w-1/3 animate-pulse rounded-full bg-primary"
                style={{ animationDuration: "700ms" }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </QueryClientProvider>
  );
}
