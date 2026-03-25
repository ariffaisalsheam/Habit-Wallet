"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { deleteBudgetRemote, loadBudgetsRemote, upsertBudgetRemote } from "@/lib/finance/service";
import type { MonthlyBudget, MonthlyBudgetInput } from "@/features/finance/types";

type BudgetsState = {
  budgets: MonthlyBudget[];
  syncing: boolean;
  errorMessage: string | null;
  loadFromBackend: () => Promise<void>;
  upsertBudget: (input: MonthlyBudgetInput) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  clearBudgetsError: () => void;
};

export const useBudgetsStore = create<BudgetsState>()(
  persist(
    (set) => ({
      budgets: [],
      syncing: false,
      errorMessage: null,
      loadFromBackend: async () => {
        set({ syncing: true, errorMessage: null });

        try {
          const budgets = await loadBudgetsRemote();
          set({ budgets, syncing: false, errorMessage: null });
        } catch (error) {
          set({
            syncing: false,
            errorMessage: error instanceof Error ? error.message : "Could not sync budgets.",
          });
        }
      },
      upsertBudget: async (input) => {
        set((state) => {
          const normalizedCategory = input.category.trim();
          const existing = state.budgets.find(
            (budget) =>
              budget.monthYear === input.monthYear &&
              budget.category.toLowerCase() === normalizedCategory.toLowerCase()
          );

          if (existing) {
            return {
              syncing: true,
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
            syncing: true,
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
            errorMessage: null,
          }));
        } catch (error) {
          set({
            syncing: false,
            errorMessage:
              error instanceof Error
                ? `${error.message} Budget saved locally only.`
                : "Budget saved locally only.",
          });
        }
      },
      deleteBudget: async (id) => {
        set((state) => ({
          syncing: true,
          budgets: state.budgets.filter((budget) => budget.id !== id),
        }));

        try {
          await deleteBudgetRemote(id);
          set({ syncing: false, errorMessage: null });
        } catch (error) {
          set({
            syncing: false,
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
