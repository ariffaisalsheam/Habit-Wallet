"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { HabitCompletion, HabitInput, HabitItem } from "@/features/habits/types";

type HabitsState = {
  habits: HabitItem[];
  completions: HabitCompletion[];
  addHabit: (input: HabitInput) => void;
  updateHabit: (id: string, input: HabitInput) => void;
  removeHabit: (id: string) => void;
  toggleCompletionForDate: (habitId: string, date: string) => void;
};

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      habits: [],
      completions: [],
      addHabit: (input) => {
        const now = new Date().toISOString();

        set((state) => ({
          habits: [
            {
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
            },
            ...state.habits,
          ],
        }));
      },
      updateHabit: (id, input) => {
        set((state) => ({
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
      },
      removeHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
          completions: state.completions.filter((completion) => completion.habitId !== id),
        }));
      },
      toggleCompletionForDate: (habitId, date) => {
        set((state) => {
          const existing = state.completions.find(
            (completion) => completion.habitId === habitId && completion.completionDate === date
          );

          if (existing) {
            return {
              completions: state.completions.filter((completion) => completion.id !== existing.id),
            };
          }

          return {
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
