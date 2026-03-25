"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

    void client.ping().catch(() => {
      // Keep startup resilient if ping fails temporarily.
    });

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
      const idleId = window.requestIdleCallback(() => runSync(true));
      void idleId;
    } else {
      globalThis.setTimeout(() => runSync(true), 100);
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
      globalThis.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncBudgets, syncHabits, syncTransactions]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
