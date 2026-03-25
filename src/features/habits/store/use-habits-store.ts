"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  createHabitRemote,
  loadHabitsBundle,
  removeHabitRemote,
  setHabitCompletionRemote,
  toggleHabitCompletionRemote,
  updateHabitRemote,
} from "@/lib/habits/service";
import {
  enqueueSyncOperation,
  getSyncQueueByCollection,
  getSyncQueueCount,
  hasQueuedDedupeKey,
  markSyncAttempt,
  removeSyncByDedupeKey,
  removeSyncByDedupePrefix,
  removeSyncOperation,
  setLastSyncNow,
} from "@/lib/storage/sync-queue";
import type { HabitCompletion, HabitInput, HabitItem } from "@/features/habits/types";

type HabitsState = {
  habits: HabitItem[];
  completions: HabitCompletion[];
  syncing: boolean;
  pendingQueueCount: number;
  errorMessage: string | null;
  loadFromBackend: () => Promise<void>;
  syncPending: () => Promise<void>;
  addHabit: (input: HabitInput) => Promise<void>;
  updateHabit: (id: string, input: HabitInput) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  toggleCompletionForDate: (habitId: string, date: string) => Promise<void>;
  clearHabitsError: () => void;
};

function getHabitsPendingCount() {
  return getSyncQueueCount("habits") + getSyncQueueCount("habit-completions");
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set) => ({
      habits: [],
      completions: [],
      syncing: false,
      pendingQueueCount: 0,
      errorMessage: null,
      loadFromBackend: async () => {
        set({ syncing: true, errorMessage: null });

        try {
          const bundle = await loadHabitsBundle();
          set({
            habits: bundle.habits,
            completions: bundle.completions,
            syncing: false,
            pendingQueueCount: getHabitsPendingCount(),
            errorMessage: null,
          });
        } catch (error) {
          set({
            syncing: false,
            pendingQueueCount: getHabitsPendingCount(),
            errorMessage: error instanceof Error ? error.message : "Could not sync habits.",
          });
        }
      },
      syncPending: async () => {
        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        if (isOffline) {
          set({ pendingQueueCount: getHabitsPendingCount() });
          return;
        }

        set({ syncing: true, errorMessage: null });
        const habitOps = getSyncQueueByCollection("habits");
        const completionOps = getSyncQueueByCollection("habit-completions");
        const operations = [...habitOps, ...completionOps];
        const localHabitToRemoteId = new Map<string, string>();
        let firstError: string | null = null;

        for (const operation of operations) {
          markSyncAttempt(operation.id);

          try {
            if (operation.collection === "habits" && operation.operation === "create") {
              const payload = operation.payload as { localId: string; input: HabitInput };
              const created = await createHabitRemote(payload.input);
              localHabitToRemoteId.set(payload.localId, created.id);

              set((state) => ({
                habits: state.habits.map((habit) => (habit.id === payload.localId ? created : habit)),
                completions: state.completions.map((completion) =>
                  completion.habitId === payload.localId
                    ? {
                        ...completion,
                        habitId: created.id,
                      }
                    : completion
                ),
              }));
            }

            if (operation.collection === "habits" && operation.operation === "update") {
              const payload = operation.payload as { id: string; input: HabitInput };
              const targetId = localHabitToRemoteId.get(payload.id) ?? payload.id;
              await updateHabitRemote(targetId, payload.input);
            }

            if (operation.collection === "habits" && operation.operation === "delete") {
              const payload = operation.payload as { id: string };
              const targetId = localHabitToRemoteId.get(payload.id) ?? payload.id;
              await removeHabitRemote(targetId);
            }

            if (operation.collection === "habit-completions" && operation.operation === "toggle") {
              const payload = operation.payload as { habitId: string; date: string; completed: boolean };
              const targetHabitId = localHabitToRemoteId.get(payload.habitId) ?? payload.habitId;
              await setHabitCompletionRemote(targetHabitId, payload.date, payload.completed);
            }

            removeSyncOperation(operation.id);
            setLastSyncNow();
          } catch (error) {
            if (!firstError) {
              firstError = error instanceof Error ? error.message : "Some habit changes are still pending sync.";
            }
          }
        }

        try {
          const bundle = await loadHabitsBundle();
          set({
            habits: bundle.habits,
            completions: bundle.completions,
            syncing: false,
            pendingQueueCount: getHabitsPendingCount(),
            errorMessage: firstError,
          });
        } catch (error) {
          set({
            syncing: false,
            pendingQueueCount: getHabitsPendingCount(),
            errorMessage:
              firstError ?? (error instanceof Error ? error.message : "Could not refresh habits after sync."),
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
            pendingQueueCount: getHabitsPendingCount(),
          }));
        } catch (error) {
          enqueueSyncOperation({
            collection: "habits",
            operation: "create",
            dedupeKey: `habits:create:${localHabit.id}`,
            payload: {
              localId: localHabit.id,
              input,
            },
          });

          set({
            syncing: false,
            pendingQueueCount: getHabitsPendingCount(),
            errorMessage:
              error instanceof Error
                ? `${error.message} Saved on this device only.`
                : "Saved on this device only.",
          });
        }
      },
      updateHabit: async (id, input) => {
        const hasQueuedCreate = hasQueuedDedupeKey(`habits:create:${id}`);

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
            pendingQueueCount: getHabitsPendingCount(),
            errorMessage: null,
          }));
        } catch (error) {
          enqueueSyncOperation({
            collection: "habits",
            operation: hasQueuedCreate ? "create" : "update",
            dedupeKey: hasQueuedCreate ? `habits:create:${id}` : `habits:update:${id}`,
            payload: hasQueuedCreate
              ? {
                  localId: id,
                  input,
                }
              : {
                  id,
                  input,
                },
          });

          set({
            syncing: false,
            pendingQueueCount: getHabitsPendingCount(),
            errorMessage:
              error instanceof Error
                ? `${error.message} Updated locally only.`
                : "Updated locally only.",
          });
        }
      },
      removeHabit: async (id) => {
        const hasQueuedCreate = hasQueuedDedupeKey(`habits:create:${id}`);

        set((state) => ({
          syncing: true,
          habits: state.habits.filter((habit) => habit.id !== id),
          completions: state.completions.filter((completion) => completion.habitId !== id),
        }));

        try {
          if (hasQueuedCreate) {
            removeSyncByDedupeKey(`habits:create:${id}`);
            removeSyncByDedupeKey(`habits:update:${id}`);
            removeSyncByDedupePrefix(`habit-completions:toggle:${id}:`);

            set({
              syncing: false,
              pendingQueueCount: getHabitsPendingCount(),
              errorMessage: null,
            });
            return;
          }

          await removeHabitRemote(id);
          set({
            syncing: false,
            pendingQueueCount: getHabitsPendingCount(),
            errorMessage: null,
          });
        } catch (error) {
          enqueueSyncOperation({
            collection: "habits",
            operation: "delete",
            dedupeKey: `habits:delete:${id}`,
            payload: { id },
          });

          set({
            syncing: false,
            pendingQueueCount: getHabitsPendingCount(),
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

            enqueueSyncOperation({
              collection: "habit-completions",
              operation: "toggle",
              dedupeKey: `habit-completions:toggle:${habitId}:${date}`,
              payload: {
                habitId,
                date,
                completed: true,
              },
            });

            return {
              syncing: false,
              pendingQueueCount: getHabitsPendingCount(),
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
