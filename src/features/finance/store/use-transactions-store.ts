"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  createTransactionRemote,
  deleteTransactionRemote,
  loadTransactionsRemote,
  updateTransactionRemote,
} from "@/lib/finance/service";
import {
  enqueueSyncOperation,
  getSyncQueueByCollection,
  getSyncQueueCount,
  markSyncAttempt,
  removeSyncByDedupeKey,
  removeSyncOperation,
  setLastSyncNow,
} from "@/lib/storage/sync-queue";
import { isCloudSyncEnabledForCurrentUser, isCloudSyncLockedError } from "@/lib/subscription/access";
import type { FinanceTransaction, TransactionInput } from "@/features/finance/types";

type TransactionsState = {
  transactions: FinanceTransaction[];
  syncing: boolean;
  pendingQueueCount: number;
  errorMessage: string | null;
  loadFromBackend: () => Promise<void>;
  syncPending: () => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearTransactionsError: () => void;
};

function buildTransaction(input: TransactionInput): FinanceTransaction {
  return {
    id: crypto.randomUUID(),
    type: input.type,
    category: input.category,
    amount: input.amount,
    currency: "BDT",
    date: input.date,
    description: input.description,
    created_at: new Date().toISOString(),
    synced: false,
  };
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set) => ({
      transactions: [],
      syncing: false,
      pendingQueueCount: 0,
      errorMessage: null,
      loadFromBackend: async () => {
        if (!isCloudSyncEnabledForCurrentUser()) {
          set({ syncing: false, pendingQueueCount: getSyncQueueCount("transactions"), errorMessage: null });
          return;
        }

        set({ syncing: true, errorMessage: null });

        try {
          const transactions = await loadTransactionsRemote();
          set({
            transactions,
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage: null,
          });
        } catch (error) {
          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage: error instanceof Error ? error.message : "Could not sync transactions.",
          });
        }
      },
      syncPending: async () => {
        if (!isCloudSyncEnabledForCurrentUser()) {
          set({ syncing: false, pendingQueueCount: getSyncQueueCount("transactions"), errorMessage: null });
          return;
        }

        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        if (isOffline) {
          set({ pendingQueueCount: getSyncQueueCount("transactions") });
          return;
        }

        set({ syncing: true, errorMessage: null });
        const operations = getSyncQueueByCollection("transactions");
        let firstError: string | null = null;

        for (const operation of operations) {
          markSyncAttempt(operation.id);

          try {
            if (operation.operation === "create") {
              const payload = operation.payload as { localId: string; input: TransactionInput };
              const created = await createTransactionRemote(payload.input);

              set((state) => ({
                transactions: state.transactions.map((transaction) =>
                  transaction.id === payload.localId ? created : transaction
                ),
              }));
            }

            if (operation.operation === "update") {
              const payload = operation.payload as { id: string; input: TransactionInput };
              await updateTransactionRemote(payload.id, payload.input);
            }

            if (operation.operation === "delete") {
              const payload = operation.payload as { id: string };
              await deleteTransactionRemote(payload.id);
            }

            removeSyncOperation(operation.id);
            setLastSyncNow();
          } catch (error) {
            if (!firstError) {
              firstError = error instanceof Error ? error.message : "Some transaction changes are still pending sync.";
            }
          }
        }

        try {
          const transactions = await loadTransactionsRemote();
          set({
            transactions,
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage: firstError,
          });
        } catch (error) {
          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage:
              firstError ??
              (error instanceof Error ? error.message : "Could not refresh transactions after sync."),
          });
        }
      },
      addTransaction: async (input) => {
        const local = buildTransaction(input);

        set((state) => ({ transactions: [local, ...state.transactions], syncing: true, errorMessage: null }));

        try {
          const created = await createTransactionRemote(input);
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === local.id ? created : transaction
            ),
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage: null,
          }));
        } catch (error) {
          if (isCloudSyncLockedError(error)) {
            set({
              syncing: false,
              pendingQueueCount: getSyncQueueCount("transactions"),
              errorMessage: null,
            });
            return;
          }

          enqueueSyncOperation({
            collection: "transactions",
            operation: "create",
            dedupeKey: `transactions:create:${local.id}`,
            payload: {
              localId: local.id,
              input,
            },
          });

          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage:
              error instanceof Error
                ? `${error.message} Saved locally only.`
                : "Saved locally only.",
          });
        }
      },
      updateTransaction: async (id, input) => {
        let targetWasSynced = true;

        set((state) => ({
          syncing: true,
          transactions: state.transactions.map((transaction) => {
            if (transaction.id !== id) {
              return transaction;
            }

            targetWasSynced = transaction.synced;

            return {
              ...transaction,
              type: input.type,
              category: input.category,
              amount: input.amount,
              date: input.date,
              description: input.description,
              synced: false,
            };
          }),
        }));

        try {
          const updated = await updateTransactionRemote(id, input);
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === id ? updated : transaction
            ),
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage: null,
          }));
        } catch (error) {
          if (isCloudSyncLockedError(error)) {
            set({
              syncing: false,
              pendingQueueCount: getSyncQueueCount("transactions"),
              errorMessage: null,
            });
            return;
          }

          enqueueSyncOperation({
            collection: "transactions",
            operation: targetWasSynced ? "update" : "create",
            dedupeKey: targetWasSynced
              ? `transactions:update:${id}`
              : `transactions:create:${id}`,
            payload: targetWasSynced
              ? {
                  id,
                  input,
                }
              : {
                  localId: id,
                  input,
                },
          });

          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage:
              error instanceof Error
                ? `${error.message} Updated locally only.`
                : "Updated locally only.",
          });
        }
      },
      deleteTransaction: async (id) => {
        let deletedWasSynced = true;

        set((state) => ({
          syncing: true,
          transactions: state.transactions.filter((transaction) => {
            if (transaction.id === id) {
              deletedWasSynced = transaction.synced;
              return false;
            }

            return true;
          }),
        }));

        try {
          if (!deletedWasSynced) {
            removeSyncByDedupeKey(`transactions:create:${id}`);
            removeSyncByDedupeKey(`transactions:update:${id}`);

            set({
              syncing: false,
              pendingQueueCount: getSyncQueueCount("transactions"),
              errorMessage: null,
            });
            return;
          }

          await deleteTransactionRemote(id);
          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage: null,
          });
        } catch (error) {
          if (isCloudSyncLockedError(error)) {
            set({
              syncing: false,
              pendingQueueCount: getSyncQueueCount("transactions"),
              errorMessage: null,
            });
            return;
          }

          enqueueSyncOperation({
            collection: "transactions",
            operation: "delete",
            dedupeKey: `transactions:delete:${id}`,
            payload: { id },
          });

          set({
            syncing: false,
            pendingQueueCount: getSyncQueueCount("transactions"),
            errorMessage:
              error instanceof Error
                ? `${error.message} Deleted locally only.`
                : "Deleted locally only.",
          });
        }
      },
      clearTransactionsError: () => {
        set({ errorMessage: null });
      },
    }),
    {
      name: STORAGE_KEYS.transactions,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactions: state.transactions,
      }),
    }
  )
);
