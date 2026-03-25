"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { client } from "@/lib/appwrite";
import { useBudgetsStore } from "@/features/finance/store/use-budgets-store";
import { useTransactionsStore } from "@/features/finance/store/use-transactions-store";
import { useHabitsStore } from "@/features/habits/store/use-habits-store";

type AppProvidersProps = {
  children: ReactNode;
};

function applyInitialTheme() {
  if (typeof window === "undefined") {
    return;
  }

  const storedTheme = window.localStorage.getItem("hw_theme");
  const theme =
    storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function AppProviders({ children }: AppProvidersProps) {
  const syncTransactions = useTransactionsStore((state) => state.syncPending);
  const syncBudgets = useBudgetsStore((state) => state.syncPending);
  const syncHabits = useHabitsStore((state) => state.syncPending);

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

    void client.ping().catch(() => {
      // Keep startup resilient if ping fails temporarily.
    });

    const runSync = () => {
      void Promise.allSettled([syncTransactions(), syncBudgets(), syncHabits()]);
    };

    runSync();

    const interval = window.setInterval(runSync, 5 * 60 * 1000);
    window.addEventListener("online", runSync);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", runSync);
    };
  }, [syncBudgets, syncHabits, syncTransactions]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
