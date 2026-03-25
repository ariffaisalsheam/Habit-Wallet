"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  CloudSun,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Sprout,
  Sun,
  Sunrise,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { useHabitsStore } from "@/features/habits/store/use-habits-store";
import { getHabitStreakDays, isHabitCompletedForDate } from "@/features/habits/utils";
import type { HabitInput, HabitItem } from "@/features/habits/types";

const habitSchema = z.object({
  title: z.string().min(2, "Habit title is required"),
  category: z.string().min(2, "Category is required"),
  color: z.string().min(4),
  frequency: z.enum(["daily", "weekly", "custom"]),
  timeBlock: z.enum(["morning", "afternoon", "evening"]),
  targetDaysPerWeek: z.coerce.number().min(1).max(7),
});

type HabitValues = z.input<typeof habitSchema>;
type DayBlock = "morning" | "afternoon" | "evening";
type Notice = {
  id: string;
  kind: "success" | "error";
  message: string;
};

const DEFAULT_HABIT_FORM_VALUES: HabitValues = {
  title: "",
  category: "Health",
  color: "#1f6b4a",
  frequency: "daily",
  timeBlock: "morning",
  targetDaysPerWeek: 7,
};

const dayBlockMeta: Record<DayBlock, { title: string; icon: typeof Sunrise; description: string }> = {
  morning: {
    title: "Morning",
    icon: Sunrise,
    description: "Slow start rituals and first-light anchors.",
  },
  afternoon: {
    title: "Afternoon",
    icon: Sun,
    description: "Midday energy with steady, focused actions.",
  },
  evening: {
    title: "Evening",
    icon: Moon,
    description: "Wind-down habits that protect deep rest.",
  },
};

function toFormValues(habit: HabitItem): HabitValues {
  return {
    title: habit.title,
    category: habit.category,
    color: habit.color,
    frequency: habit.frequency,
    timeBlock: habit.timeBlock ?? "morning",
    targetDaysPerWeek: habit.targetDaysPerWeek,
  };
}

function getMoodTone(completionRatio: number) {
  if (completionRatio >= 0.8) {
    return "Clear Morning";
  }

  if (completionRatio >= 0.45) {
    return "Steady Breeze";
  }

  return "Soft Reset";
}

export function HabitsDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const reflectionKey = `${STORAGE_KEYS.dailyReflection}_${today}`;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [reflection, setReflection] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(reflectionKey) ?? "";
  });

  const habits = useHabitsStore((state) => state.habits);
  const completions = useHabitsStore((state) => state.completions);
  const addHabit = useHabitsStore((state) => state.addHabit);
  const updateHabit = useHabitsStore((state) => state.updateHabit);
  const removeHabit = useHabitsStore((state) => state.removeHabit);
  const toggleCompletionForDate = useHabitsStore((state) => state.toggleCompletionForDate);
  const loadFromBackend = useHabitsStore((state) => state.loadFromBackend);
  const syncPending = useHabitsStore((state) => state.syncPending);
  const syncing = useHabitsStore((state) => state.syncing);
  const pendingQueueCount = useHabitsStore((state) => state.pendingQueueCount);
  const errorMessage = useHabitsStore((state) => state.errorMessage);
  const clearHabitsError = useHabitsStore((state) => state.clearHabitsError);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HabitValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: DEFAULT_HABIT_FORM_VALUES,
  });

  const completedToday = habits.filter((habit) =>
    isHabitCompletedForDate(completions, habit.id, today)
  ).length;

  const completionRatio = habits.length ? completedToday / habits.length : 0;
  const moodTone = getMoodTone(completionRatio);
  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );
  const focusHabit = habits.find((habit) => !isHabitCompletedForDate(completions, habit.id, today));
  const topStreak = habits.reduce(
    (max, habit) => Math.max(max, getHabitStreakDays(completions, habit.id, today)),
    0
  );

  const blockGroups = useMemo(() => {
    const grouped: Record<DayBlock, HabitItem[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    habits.forEach((habit) => {
      const block = habit.timeBlock ?? "morning";
      grouped[block].push(habit);
    });

    return grouped;
  }, [habits]);

  const ringSize = 112;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const ringOffset = circumference - circumference * completionRatio;

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(reflectionKey, reflection);
  }, [reflection, reflectionKey]);

  useEffect(() => {
    void loadFromBackend();
  }, [loadFromBackend]);

  useEffect(() => {
    if (!errorMessage) return;

    pushNotice("error", errorMessage);

    const timer = window.setTimeout(() => {
      clearHabitsError();
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [clearHabitsError, errorMessage]);

  useEffect(() => {
    if (!successMessage) return;

    pushNotice("success", successMessage);

    const timer = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null);

    const payload: HabitInput = {
      title: values.title.trim(),
      category: values.category.trim(),
      color: values.color,
      frequency: values.frequency,
      timeBlock: values.timeBlock,
      targetDaysPerWeek: Number(values.targetDaysPerWeek),
    };

    if (editingId) {
      await updateHabit(editingId, payload);
      setEditingId(null);
      setSuccessMessage("Habit updated successfully.");
    } else {
      await addHabit(payload);
      setSuccessMessage("Habit added successfully.");
    }

    reset(DEFAULT_HABIT_FORM_VALUES);

    if (!editingId) {
      setShowForm(false);
    }
  });

  function startEdit(habit: HabitItem) {
    setEditingId(habit.id);
    setShowForm(false);
    reset(toFormValues(habit));
  }

  function cancelEdit() {
    setEditingId(null);
    reset(DEFAULT_HABIT_FORM_VALUES);
  }

  function pushNotice(kind: Notice["kind"], message: string) {
    const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotices((current) => [...current, { id, kind, message }]);

    window.setTimeout(() => {
      setNotices((current) => current.filter((notice) => notice.id !== id));
    }, kind === "error" ? 6500 : 3200);
  }

  const editingHabit = editingId ? habits.find((habit) => habit.id === editingId) ?? null : null;

  useEffect(() => {
    if (!editingId) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelEdit();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editingId]);

  async function handleSyncNow() {
    await syncPending();
  }

  return (
    <section className="space-y-5 pb-10 animate-soft-rise">
      {syncing ? (
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-elevated px-3 py-1 text-xs text-muted-foreground">
          <RefreshCw size={12} className="animate-spin" /> Syncing habits...
        </p>
      ) : null}
      {pendingQueueCount > 0 ? (
        <div className="glass-panel flex items-center justify-between gap-3 rounded-2xl border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:bg-amber-300/10 dark:text-amber-200">
          <p className="inline-flex items-center gap-1.5">
            <AlertTriangle size={14} /> {pendingQueueCount} habit change(s) queued for cloud sync.
          </p>
          <button
            type="button"
            onClick={() => {
              void handleSyncNow();
            }}
            disabled={syncing}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
          >
            <RefreshCw size={13} /> Sync now
          </button>
        </div>
      ) : null}

      <div className="pointer-events-none fixed left-3 right-3 top-[5.8rem] z-[95] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-[min(90vw,24rem)]">
        {notices.map((notice) => (
          <div
            key={notice.id}
            role="status"
            aria-live="polite"
            className={`animate-toast-in pointer-events-auto rounded-2xl border px-3 py-2 text-sm shadow-[var(--soft-shadow)] ${
              notice.kind === "error"
                ? "border-amber-300 bg-amber-100 text-amber-900"
                : "border-emerald-300 bg-emerald-100 text-emerald-900"
            }`}
          >
            <p className="inline-flex items-start gap-2">
              {notice.kind === "error" ? <AlertTriangle size={16} className="mt-0.5" /> : <CheckCircle2 size={16} className="mt-0.5" />}
              <span>{notice.message}</span>
            </p>
          </div>
        ))}
      </div>

      <article className="wellness-card animate-breathe relative overflow-hidden rounded-[2rem] p-5">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/15 blur-2xl" />
        <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Today</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{formattedDate}</h2>
            <p className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <CloudSun size={13} /> {moodTone}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {focusHabit
                ? `Your gentle focus: ${focusHabit.title}`
                : "No habit selected yet. Add one small ritual to begin your day."}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-3xl bg-surface/80 px-4 py-3 shadow-[var(--card-shadow)]">
            <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} aria-hidden="true">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.16"
                strokeWidth="10"
                className="text-primary"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={ringOffset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                className="calm-ring text-primary"
              />
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                className="fill-foreground text-xl font-semibold"
              >
                {Math.round(completionRatio * 100)}%
              </text>
            </svg>
            <p className="text-sm text-muted-foreground">
              {completedToday} of {habits.length} habits completed
            </p>
          </div>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <article className="wellness-card rounded-[2rem] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Daily Rhythm</h3>
            <p className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-foreground">
              <Sprout size={12} /> {topStreak} day growth
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {(["morning", "afternoon", "evening"] as DayBlock[]).map((block) => {
              const BlockIcon = dayBlockMeta[block].icon;
              const blockHabits = blockGroups[block];

              return (
                <section key={block} className="rounded-3xl bg-surface/75 p-3 shadow-[var(--card-shadow)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                        <BlockIcon size={16} /> {dayBlockMeta[block].title}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">{dayBlockMeta[block].description}</p>
                    </div>
                    <span className="rounded-full bg-surface-elevated px-2 py-1 text-xs text-muted-foreground">
                      {blockHabits.length}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {blockHabits.length === 0 ? (
                      <li className="rounded-2xl border border-border/60 border-dashed px-3 py-3 text-sm text-muted-foreground">
                        Nothing scheduled here yet.
                      </li>
                    ) : (
                      blockHabits.map((habit) => {
                        const completed = isHabitCompletedForDate(completions, habit.id, today);
                        const streak = getHabitStreakDays(completions, habit.id, today);

                        return (
                          <li
                            key={habit.id}
                            className="rounded-2xl border border-border/65 bg-surface-elevated px-3 py-3 shadow-[var(--card-shadow)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-foreground">{habit.title}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{habit.category}</span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Sparkles size={12} className="text-secondary" />
                                    {streak} day flow
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEdit(habit)}
                                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border/70 bg-surface text-foreground"
                                  aria-label="Edit habit"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void removeHabit(habit.id);
                                  }}
                                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border/70 bg-surface text-foreground"
                                  aria-label="Delete habit"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {habit.frequency} • {habit.targetDaysPerWeek} days/week
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  void toggleCompletionForDate(habit.id, today);
                                }}
                                className={
                                  completed
                                    ? "soft-glow-active inline-flex min-h-10 items-center gap-1 rounded-full bg-primary/20 px-3 text-xs font-semibold text-foreground"
                                    : "inline-flex min-h-10 items-center gap-1 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground"
                                }
                              >
                                <CheckCircle2 size={14} className={completed ? "animate-breathe text-primary" : "text-muted-foreground"} />
                                {completed ? "Completed" : "Tap to complete"}
                              </button>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </section>
              );
            })}
          </div>
        </article>

        <div className="space-y-4">
          <article className="wellness-card rounded-[2rem] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Reflection</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Write one intention for today or a brief gratitude note.
            </p>
            <textarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              rows={5}
              className="mt-3 w-full rounded-2xl border border-border/70 bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-accent"
              placeholder="I will slow down between tasks and take three mindful breaths."
            />
          </article>

          <article className="wellness-card rounded-[2rem] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Add habit</h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm((value) => !value);
                  if (!showForm) {
                    reset(DEFAULT_HABIT_FORM_VALUES);
                  }
                }}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-border/70 bg-surface-elevated text-foreground"
                aria-label={showForm ? "Hide habit form" : "Show habit form"}
              >
                <Plus size={16} className={showForm ? "rotate-45 transition-transform" : "transition-transform"} />
              </button>
            </div>

            {showForm ? (
              <form className="mt-3 space-y-3" onSubmit={onSubmit} noValidate>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Habit title</span>
                  <input
                    type="text"
                    placeholder="e.g. Read 20 minutes"
                    className="min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                    {...register("title")}
                  />
                  {errors.title ? <span className="mt-1 block text-xs text-red-600">{errors.title.message}</span> : null}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Category</span>
                    <input
                      type="text"
                      className="min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                      {...register("category")}
                    />
                    {errors.category ? (
                      <span className="mt-1 block text-xs text-red-600">{errors.category.message}</span>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Color</span>
                    <input
                      type="color"
                      className="min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-2"
                      {...register("color")}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Frequency</span>
                    <select
                      className="app-select min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                      {...register("frequency")}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Time block</span>
                    <select
                      className="app-select min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                      {...register("timeBlock")}
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Target days/week</span>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      className="min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                      {...register("targetDaysPerWeek")}
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary/85 px-4 text-sm font-semibold text-white"
                  >
                    Add habit
                  </button>
                  {showForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        reset(DEFAULT_HABIT_FORM_VALUES);
                      }}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Keep this tucked away to reduce clutter. Open only when you are ready to add something new.
                </p>
                {habits.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex min-h-10 items-center rounded-full bg-primary/85 px-4 text-sm font-semibold text-white"
                  >
                    Add your first habit
                  </button>
                ) : null}
              </div>
            )}
          </article>
        </div>
      </div>

      {editingHabit ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Edit habit">
          <div className="wellness-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Edit Habit</p>
                <h3 className="text-lg font-semibold text-foreground">{editingHabit.title}</h3>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-border/70 bg-surface-elevated text-foreground"
                aria-label="Close edit modal"
              >
                <Plus size={16} className="rotate-45" />
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={onSubmit} noValidate>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Habit title</span>
                <input
                  type="text"
                  placeholder="e.g. Read 20 minutes"
                  className="min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                  {...register("title")}
                />
                {errors.title ? <span className="mt-1 block text-xs text-red-600">{errors.title.message}</span> : null}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Category</span>
                  <input
                    type="text"
                    className="min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                    {...register("category")}
                  />
                  {errors.category ? (
                    <span className="mt-1 block text-xs text-red-600">{errors.category.message}</span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Color</span>
                  <input
                    type="color"
                    className="min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-2"
                    {...register("color")}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Frequency</span>
                  <select
                    className="app-select min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                    {...register("frequency")}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Time block</span>
                  <select
                    className="app-select min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                    {...register("timeBlock")}
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Target days/week</span>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    className="min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                    {...register("targetDaysPerWeek")}
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary/85 px-4 text-sm font-semibold text-white"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
