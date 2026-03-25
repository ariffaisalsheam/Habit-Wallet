"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { FinanceTransaction, TransactionInput } from "@/features/finance/types";

type TransactionsState = {
  transactions: FinanceTransaction[];
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
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
      addTransaction: (input) => {
        set((state) => ({
          transactions: [buildTransaction(input), ...state.transactions],
        }));
      },
      updateTransaction: (id, input) => {
        set((state) => ({
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
      },
      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }));
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
