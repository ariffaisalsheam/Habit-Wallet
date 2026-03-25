"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { MonthlyBudget, MonthlyBudgetInput } from "@/features/finance/types";

type BudgetsState = {
  budgets: MonthlyBudget[];
  upsertBudget: (input: MonthlyBudgetInput) => void;
  deleteBudget: (id: string) => void;
};

export const useBudgetsStore = create<BudgetsState>()(
  persist(
    (set) => ({
      budgets: [],
      upsertBudget: (input) => {
        set((state) => {
          const normalizedCategory = input.category.trim();
          const existing = state.budgets.find(
            (budget) =>
              budget.monthYear === input.monthYear &&
              budget.category.toLowerCase() === normalizedCategory.toLowerCase()
          );

          if (existing) {
            return {
              budgets: state.budgets.map((budget) =>
                budget.id === existing.id
                  ? {
                      ...budget,
                      limitAmount: input.limitAmount,
                      category: normalizedCategory,
                      updatedAt: new Date().toISOString(),
                    }
                  : budget
              ),
            };
          }

          return {
            budgets: [
              {
                id: crypto.randomUUID(),
                monthYear: input.monthYear,
                category: normalizedCategory,
                limitAmount: input.limitAmount,
                updatedAt: new Date().toISOString(),
              },
              ...state.budgets,
            ],
          };
        });
      },
      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((budget) => budget.id !== id),
        }));
      },
    }),
    {
      name: STORAGE_KEYS.budgets,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ budgets: state.budgets }),
    }
  )
);
