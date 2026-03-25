"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  createHabitRemote,
  loadHabitsBundle,
  removeHabitRemote,
  toggleHabitCompletionRemote,
  updateHabitRemote,
} from "@/lib/habits/service";
import type { HabitCompletion, HabitInput, HabitItem } from "@/features/habits/types";

type HabitsState = {
  habits: HabitItem[];
  completions: HabitCompletion[];
  syncing: boolean;
  errorMessage: string | null;
  loadFromBackend: () => Promise<void>;
  addHabit: (input: HabitInput) => Promise<void>;
  updateHabit: (id: string, input: HabitInput) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  toggleCompletionForDate: (habitId: string, date: string) => Promise<void>;
  clearHabitsError: () => void;
};

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      habits: [],
      completions: [],
      syncing: false,
      errorMessage: null,
      loadFromBackend: async () => {
        set({ syncing: true, errorMessage: null });

        try {
          const bundle = await loadHabitsBundle();
          set({
            habits: bundle.habits,
            completions: bundle.completions,
            syncing: false,
            errorMessage: null,
          });
        } catch (error) {
          set({
            syncing: false,
            errorMessage: error instanceof Error ? error.message : "Could not sync habits.",
          });
        }
      },
      addHabit: async (input) => {
        const now = new Date().toISOString();
        const localHabit: HabitItem = {
          id: crypto.randomUUID(),
          title: input.title.trim(),
          category: input.category.trim(),
          color: input.color,
          frequency: input.frequency,
          timeBlock: input.timeBlock,
          targetDaysPerWeek: input.targetDaysPerWeek,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({ habits: [localHabit, ...state.habits], syncing: true, errorMessage: null }));

        try {
          const created = await createHabitRemote(input);
          set((state) => ({
            habits: state.habits.map((habit) => (habit.id === localHabit.id ? created : habit)),
            syncing: false,
          }));
        } catch (error) {
          set({
            syncing: false,
            errorMessage:
              error instanceof Error
                ? `${error.message} Saved on this device only.`
                : "Saved on this device only.",
          });
        }
      },
      updateHabit: async (id, input) => {
        set((state) => ({
          syncing: true,
          habits: state.habits.map((habit) =>
            habit.id === id
              ? {
                  ...habit,
                  title: input.title.trim(),
                  category: input.category.trim(),
                  color: input.color,
                  frequency: input.frequency,
                  timeBlock: input.timeBlock,
                  targetDaysPerWeek: input.targetDaysPerWeek,
                  updatedAt: new Date().toISOString(),
                }
              : habit
          ),
        }));

        try {
          const updated = await updateHabitRemote(id, input);
          set((state) => ({
            habits: state.habits.map((habit) => (habit.id === id ? updated : habit)),
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
      removeHabit: async (id) => {
        set((state) => ({
          syncing: true,
          habits: state.habits.filter((habit) => habit.id !== id),
          completions: state.completions.filter((completion) => completion.habitId !== id),
        }));

        try {
          await removeHabitRemote(id);
          set({ syncing: false, errorMessage: null });
        } catch (error) {
          set({
            syncing: false,
            errorMessage:
              error instanceof Error
                ? `${error.message} Removed locally only.`
                : "Removed locally only.",
          });
        }
      },
      toggleCompletionForDate: async (habitId, date) => {
        let removedLocalId: string | null = null;

        set((state) => {
          const existing = state.completions.find(
            (completion) => completion.habitId === habitId && completion.completionDate === date
          );

          if (existing) {
            removedLocalId = existing.id;
            return {
              syncing: true,
              completions: state.completions.filter((completion) => completion.id !== existing.id),
            };
          }

          return {
            syncing: true,
            completions: [
              {
                id: crypto.randomUUID(),
                habitId,
                completionDate: date,
                completedAt: new Date().toISOString(),
                notes: "",
                synced: false,
              },
              ...state.completions,
            ],
          };
        });

        try {
          const result = await toggleHabitCompletionRemote(habitId, date);

          set((state) => {
            if (!result) {
              return { syncing: false, errorMessage: null };
            }

            const optimistic = state.completions.find(
              (completion) =>
                completion.habitId === habitId &&
                completion.completionDate === date &&
                completion.id !== result.id
            );

            if (!optimistic) {
              return {
                completions: [result, ...state.completions],
                syncing: false,
                errorMessage: null,
              };
            }

            return {
              completions: state.completions.map((completion) =>
                completion.id === optimistic.id ? result : completion
              ),
              syncing: false,
              errorMessage: null,
            };
          });
        } catch (error) {
          set((state) => {
            if (removedLocalId) {
              return {
                completions: [
                  {
                    id: removedLocalId,
                    habitId,
                    completionDate: date,
                    completedAt: new Date().toISOString(),
                    notes: "",
                    synced: false,
                  },
                  ...state.completions,
                ],
                syncing: false,
                errorMessage:
                  error instanceof Error
                    ? `${error.message} Synced locally only.`
                    : "Synced locally only.",
              };
            }

            return {
              syncing: false,
              errorMessage:
                error instanceof Error
                  ? `${error.message} Synced locally only.`
                  : "Synced locally only.",
            };
          });
        }
      },
      clearHabitsError: () => {
        set({ errorMessage: null });
      },
    }),
    {
      name: STORAGE_KEYS.habits,
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<HabitsState>;

        return {
          ...currentState,
          ...persisted,
          habits: (persisted.habits ?? currentState.habits).map((habit) => ({
            ...habit,
            timeBlock: habit.timeBlock ?? "morning",
          })),
        };
      },
      partialize: (state) => ({
        habits: state.habits,
        completions: state.completions,
      }),
    }
  )
);
