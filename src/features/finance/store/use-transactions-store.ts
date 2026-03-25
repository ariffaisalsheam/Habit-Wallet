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
import type { FinanceTransaction, TransactionInput } from "@/features/finance/types";

type TransactionsState = {
  transactions: FinanceTransaction[];
  syncing: boolean;
  errorMessage: string | null;
  loadFromBackend: () => Promise<void>;
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
      errorMessage: null,
      loadFromBackend: async () => {
        set({ syncing: true, errorMessage: null });

        try {
          const transactions = await loadTransactionsRemote();
          set({ transactions, syncing: false, errorMessage: null });
        } catch (error) {
          set({
            syncing: false,
            errorMessage: error instanceof Error ? error.message : "Could not sync transactions.",
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
            errorMessage: null,
          }));
        } catch (error) {
          set({
            syncing: false,
            errorMessage:
              error instanceof Error
                ? `${error.message} Saved locally only.`
                : "Saved locally only.",
          });
        }
      },
      updateTransaction: async (id, input) => {
        set((state) => ({
          syncing: true,
          transactions: state.transactions.map((transaction) => {
            if (transaction.id !== id) {
              return transaction;
            }

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
            errorMessage: null,
          }));
        } catch (error) {
          set({
            syncing: false,
            errorMessage:
              error instanceof Error
                ? `${error.message} Updated locally only.`
                : "Updated locally only.",
          });
        }
      },
      deleteTransaction: async (id) => {
        set((state) => ({
          syncing: true,
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }));

        try {
          await deleteTransactionRemote(id);
          set({ syncing: false, errorMessage: null });
        } catch (error) {
          set({
            syncing: false,
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
