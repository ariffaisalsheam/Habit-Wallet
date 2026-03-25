"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { deleteBudgetRemote, loadBudgetsRemote, upsertBudgetRemote } from "@/lib/finance/service";
import {
  enqueueSyncOperation,
  getSyncQueueByCollection,
  getSyncQueueCount,
  hasQueuedDedupeKey,
  markSyncAttempt,
  removeSyncByDedupeKey,
  removeSyncOperation,
  setLastSyncNow,
} from "@/lib/storage/sync-queue";
import { isCloudSyncEnabledForCurrentUser, isCloudSyncLockedError } from "@/lib/subscription/access";
import type { MonthlyBudget, MonthlyBudgetInput } from "@/features/finance/types";

type BudgetsState = {
  budgets: MonthlyBudget[];
  syncing: boolean;
  pendingQueueCount: number;
  errorMessage: string | null;
  loadFromBackend: () => Promise<void>;
  syncPending: () => Promise<void>;
  upsertBudget: (input: MonthlyBudgetInput) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  clearBudgetsError: () => void;
};

export const useBudgetsStore = create<BudgetsState>()(
  persist(
    (set) => ({
      budgets: [],
      syncing: false,
      pendingQueueCount: 0,
      errorMessage: null,
      loadFromBackend: async () => {
        if (!isCloudSyncEnabledForCurrentUser()) {
          set({ syncing: false, pendingQueueCount: getSyncQueueCount("budgets"), errorMessage: null });
          return;
        }

        set({ syncing: true, errorMessage: null });

        try {
          const budgets = await loadBudgetsRemote();
          set({
            budgets,
            syncing: false,
            pendingQueueCount: getSyncQueueCount("budgets"),
            errorMessage: null,
          });
        } catch (error) {
          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("budgets"),
            errorMessage: error instanceof Error ? error.message : "Could not sync budgets.",
          });
        }
      },
      syncPending: async () => {
        if (!isCloudSyncEnabledForCurrentUser()) {
          set({ syncing: false, pendingQueueCount: getSyncQueueCount("budgets"), errorMessage: null });
          return;
        }

        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        if (isOffline) {
          set({ pendingQueueCount: getSyncQueueCount("budgets") });
          return;
        }

        set({ syncing: true, errorMessage: null });
        const operations = getSyncQueueByCollection("budgets");
        let firstError: string | null = null;

        for (const operation of operations) {
          markSyncAttempt(operation.id);

          try {
            if (operation.operation === "upsert") {
              const payload = operation.payload as { input: MonthlyBudgetInput };
              await upsertBudgetRemote(payload.input);
            }

            if (operation.operation === "delete") {
              const payload = operation.payload as { id: string };
              await deleteBudgetRemote(payload.id);
            }

            removeSyncOperation(operation.id);
            setLastSyncNow();
          } catch (error) {
            if (!firstError) {
              firstError = error instanceof Error ? error.message : "Some budget changes are still pending sync.";
            }
          }
        }

        try {
          const budgets = await loadBudgetsRemote();
          set({
            budgets,
            syncing: false,
            pendingQueueCount: getSyncQueueCount("budgets"),
            errorMessage: firstError,
          });
        } catch (error) {
          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("budgets"),
            errorMessage:
              firstError ??
              (error instanceof Error ? error.message : "Could not refresh budgets after sync."),
          });
        }
      },
      upsertBudget: async (input) => {
        const normalizedCategory = input.category.trim().toLowerCase();

        set((state) => {
          const normalizedCategoryRaw = input.category.trim();
          const existing = state.budgets.find(
            (budget) =>
              budget.monthYear === input.monthYear &&
              budget.category.toLowerCase() === normalizedCategoryRaw.toLowerCase()
          );

          if (existing) {
            return {
              syncing: true,
              budgets: state.budgets.map((budget) =>
                budget.id === existing.id
                  ? {
                      ...budget,
                      limitAmount: input.limitAmount,
                      category: normalizedCategoryRaw,
                      updatedAt: new Date().toISOString(),
                    }
                  : budget
              ),
            };
          }

          return {
            syncing: true,
            budgets: [
              {
                id: crypto.randomUUID(),
                monthYear: input.monthYear,
                category: normalizedCategoryRaw,
                limitAmount: input.limitAmount,
                updatedAt: new Date().toISOString(),
              },
              ...state.budgets,
            ],
          };
        });

        try {
          const remote = await upsertBudgetRemote(input);
          set((state) => ({
            budgets: [
              remote,
              ...state.budgets.filter(
                (budget) =>
                  !(
                    budget.monthYear === remote.monthYear &&
                    budget.category.toLowerCase() === remote.category.toLowerCase()
                  )
              ),
            ],
            syncing: false,
            pendingQueueCount: getSyncQueueCount("budgets"),
            errorMessage: null,
          }));
        } catch (error) {
          if (isCloudSyncLockedError(error)) {
            set({
              syncing: false,
              pendingQueueCount: getSyncQueueCount("budgets"),
              errorMessage: null,
            });
            return;
          }

          enqueueSyncOperation({
            collection: "budgets",
            operation: "upsert",
            dedupeKey: `budgets:upsert:${input.monthYear}:${normalizedCategory}`,
            payload: { input },
          });

          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("budgets"),
            errorMessage:
              error instanceof Error
                ? `${error.message} Budget saved locally only.`
                : "Budget saved locally only.",
          });
        }
      },
      deleteBudget: async (id) => {
        let removedBudget: MonthlyBudget | null = null;

        set((state) => {
          removedBudget = state.budgets.find(b => b.id === id) || null;
          return {
            syncing: true,
            budgets: state.budgets.filter((budget) => budget.id !== id),
          };
        });

        try {
          if (removedBudget) {
            const rb = removedBudget as MonthlyBudget;
            const dedupeKey = `budgets:upsert:${rb.monthYear}:${rb.category.toLowerCase()}`;

            if (hasQueuedDedupeKey(dedupeKey)) {
              removeSyncByDedupeKey(dedupeKey);
              set({
                syncing: false,
                pendingQueueCount: getSyncQueueCount("budgets"),
                errorMessage: null,
              });
              return;
            }
          }

          await deleteBudgetRemote(id);
          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("budgets"),
            errorMessage: null,
          });
        } catch (error) {
          if (isCloudSyncLockedError(error)) {
            set({
              syncing: false,
              pendingQueueCount: getSyncQueueCount("budgets"),
              errorMessage: null,
            });
            return;
          }

          enqueueSyncOperation({
            collection: "budgets",
            operation: "delete",
            dedupeKey: `budgets:delete:${id}`,
            payload: { id },
          });

          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("budgets"),
            errorMessage:
              error instanceof Error
                ? `${error.message} Budget removed locally only.`
                : "Budget removed locally only.",
          });
        }
      },
      clearBudgetsError: () => {
        set({ errorMessage: null });
      },
    }),
    {
      name: STORAGE_KEYS.budgets,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ budgets: state.budgets }),
    }
  )
);
