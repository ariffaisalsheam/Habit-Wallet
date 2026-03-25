"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Bot,
  BookmarkCheck,
  CheckCircle2,
  CloudSun,
  Eraser,
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

function pickBySeed<T>(items: readonly T[], seed: string): T {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }

  const itemIndex = Math.abs(hash) % items.length;
  return items[itemIndex];
}

export function HabitsDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const reflectionKey = `${STORAGE_KEYS.dailyReflection}_${today}`;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [reflectionDirty, setReflectionDirty] = useState(false);
  const [reflectionSavedAt, setReflectionSavedAt] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");

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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HabitValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: DEFAULT_HABIT_FORM_VALUES,
  });

  const selectedFrequency = watch("frequency");
  const selectedColor = watch("color");

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
  const hasReflection = reflection.trim().length > 0;
  const reflectionHealth = reflection.trim().length >= 24 ? "Ready" : reflection.trim().length > 0 ? "Draft" : "Empty";

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
    if (typeof window === "undefined") {
      return;
    }

    const rawPlan = window.localStorage.getItem(reflectionKey) ?? "";
    setReflection(rawPlan);

    const rawSavedAt = window.localStorage.getItem(`${reflectionKey}_saved_at`);
    setReflectionSavedAt(rawSavedAt);
  }, [reflectionKey]);

  useEffect(() => {
    if (selectedFrequency !== "daily") {
      return;
    }

    setValue("targetDaysPerWeek", 7, { shouldValidate: true });
  }, [selectedFrequency, setValue]);

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

  const onSubmit = handleSubmit(async (values) => {
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
      pushNotice("success", "Habit updated successfully.");
    } else {
      await addHabit(payload);
      pushNotice("success", "Habit added successfully.");
    }

    reset(DEFAULT_HABIT_FORM_VALUES);
    setEditingId(null);
    setModalMode(null);
  });

  function startEdit(habit: HabitItem) {
    setEditingId(habit.id);
    setModalMode("edit");
    reset(toFormValues(habit));
  }

  function openAddModal() {
    setEditingId(null);
    setModalMode("add");
    reset(DEFAULT_HABIT_FORM_VALUES);
  }

  function closeModal() {
    setEditingId(null);
    setModalMode(null);
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

  const reflectionPrompts = [
    "Top 3 must-do actions for today:",
    "If I get stuck, I will start with this 5-minute action:",
    "Biggest likely blocker and my fallback plan:",
  ];

  function saveReflection() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(reflectionKey, reflection);
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(`${reflectionKey}_saved_at`, savedAt);
    setReflectionSavedAt(savedAt);
    setReflectionDirty(false);
    pushNotice("success", "Action plan saved.");
  }

  function clearReflection() {
    setReflection("");
    setReflectionDirty(true);
  }

  function appendPrompt(prompt: string) {
    setReflection((current) => {
      const spacer = current.trim().length > 0 ? "\n\n" : "";
      return `${current}${spacer}${prompt} `;
    });
    setReflectionDirty(true);
  }

  function getFrequencyLabel(habit: HabitItem) {
    if (habit.frequency === "daily") {
      return "Daily";
    }

    if (habit.frequency === "weekly") {
      return `Weekly \u00b7 ${habit.targetDaysPerWeek} day${habit.targetDaysPerWeek > 1 ? "s" : ""}`;
    }

    return `Flexible \u00b7 ${habit.targetDaysPerWeek} day${habit.targetDaysPerWeek > 1 ? "s" : ""}`;
  }

  function getBlockCompletionCount(blockHabits: HabitItem[]) {
    return blockHabits.reduce(
      (count, habit) => count + (isHabitCompletedForDate(completions, habit.id, today) ? 1 : 0),
      0
    );
  }

  const aiInsight = useMemo(() => {
    const dominantBlock = (Object.entries(blockGroups) as [DayBlock, HabitItem[]][]).reduce(
      (top, current) => {
        if (current[1].length > top[1].length) {
          return current;
        }

        return top;
      },
      ["morning", [] as HabitItem[]]
    )[0];

    const seed = `${today}-${habits.length}-${completedToday}-${topStreak}-${focusHabit?.id ?? "none"}-${dominantBlock}`;

    if (habits.length === 0) {
      return {
        title: "Start with one anchor habit",
        suggestion: "Add one 5-minute habit for your first block. Consistency beats complexity.",
        nextMove: "Create one simple habit and complete it today.",
        fallback: "Keep scope tiny: one habit, one finish.",
        risk: "low" as const,
      };
    }

    const focusName = focusHabit?.title ?? "your next easiest habit";

    if (completionRatio < 0.35) {
      const title = pickBySeed(
        [
          "Execution risk is high right now",
          "Day is slipping into reactive mode",
          "You need one fast reset",
        ],
        `${seed}-high-title`
      );

      const suggestion = pickBySeed(
        [
          `Do ${focusName} in the next 10 minutes, then reassess your plan.`,
          `Shrink scope: pick one must-do habit and protect a 15-minute focus window.`,
          "Ignore backlog for now. Lock one quick completion to restart momentum.",
        ],
        `${seed}-high-suggestion`
      );

      return {
        title,
        suggestion,
        nextMove: `Open ${dayBlockMeta[dominantBlock].title} block and finish one 5-minute action now.`,
        fallback: "If interrupted, complete the easiest 2-minute version immediately.",
        risk: "high" as const,
      };
    }

    if (completionRatio < 0.7) {
      const title = pickBySeed(
        [
          "Momentum is building",
          "You are in recovery flow",
          "Progress is stable but fragile",
        ],
        `${seed}-medium-title`
      );

      const suggestion = pickBySeed(
        [
          `Finish ${focusName} before switching context to lock this momentum.`,
          "Batch two short habits back-to-back to increase confidence and speed.",
          "Protect your next block from distractions and clear one meaningful task.",
        ],
        `${seed}-medium-suggestion`
      );

      return {
        title,
        suggestion,
        nextMove: `Complete one ${dominantBlock} habit before your next interruption.`,
        fallback: "If momentum drops, do one quick habit before checking anything else.",
        risk: "medium" as const,
      };
    }

    const title = pickBySeed(
      [
        "You are in strong flow",
        "Consistency mode is active",
        "Execution quality is high",
      ],
      `${seed}-low-title`
    );

    const suggestion = pickBySeed(
      [
        "Maintain quality by scheduling your next habit before this block ends.",
        "Use this momentum to finish one meaningful habit you have been delaying.",
        "Avoid overloading. Keep the same pace and close your final key habit cleanly.",
      ],
      `${seed}-low-suggestion`
    );

    return {
      title,
      suggestion,
      nextMove: `Protect your streak: finish ${focusName} before ending this session.`,
      fallback: "If the day shifts, preserve quality by completing one meaningful habit.",
      risk: "low" as const,
    };
  }, [blockGroups, completedToday, completionRatio, focusHabit, habits.length, today, topStreak]);

  const tickerContent = useMemo(() => {
    if (!reflection.trim()) {
      return "";
    }

    return reflection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("  •  ");
  }, [reflection]);

  const hasTickerContent = tickerContent.length > 0;
  const shouldAnimateTicker = tickerContent.length > 48;
  const tickerDurationSeconds = Math.min(42, Math.max(18, Math.round(tickerContent.length * 0.42)));

  function applyAiDraft() {
    const focusLine = focusHabit ? `Focus: ${focusHabit.title}` : "Focus: one quick win habit";
    const statusLine = `Status: ${completedToday}/${habits.length} done (${Math.round(completionRatio * 100)}%)`;
    const nextLine = `Next: ${aiInsight.nextMove}`;
    const fallbackLine = `Fallback: ${aiInsight.fallback}`;
    const plan = `${focusLine}\n${statusLine}\n${nextLine}\n${fallbackLine}`;

    setReflection(plan);
    setReflectionDirty(true);
    pushNotice("success", "AI action plan generated.");
  }

  useEffect(() => {
    if (!modalMode) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalMode]);

  async function handleSyncNow() {
    await syncPending();
  }

  return (
    <section className="space-y-5 pb-10 animate-soft-rise">
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

      <div className="flex items-center justify-between gap-3">
        {hasTickerContent ? (
          <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-surface-elevated px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                <Sparkles size={10} /> Plan Feed
              </span>
            </div>

            <div className="plan-feed-viewport">
              <div
                className={`plan-feed-track ${shouldAnimateTicker ? "plan-feed-animated" : ""}`}
                style={{ ["--plan-feed-duration" as string]: `${tickerDurationSeconds}s` }}
              >
                <span className="plan-feed-item text-xs font-medium text-foreground">{tickerContent}</span>
                {shouldAnimateTicker ? (
                  <span aria-hidden="true" className="plan-feed-item text-xs font-medium text-foreground">
                    {"  •  "}
                    {tickerContent}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div aria-hidden="true" className="min-w-0 flex-1" />
        )}
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-primary/90 px-4 text-sm font-semibold text-white shadow-[var(--card-shadow)] transition hover:-translate-y-0.5 hover:bg-primary"
        >
          <Plus size={14} /> Add habit
        </button>
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Daily Rhythm</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Move through your day in focused blocks and close each one with intent.
              </p>
            </div>
            <p className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-foreground">
              <Sprout size={12} /> {topStreak} day growth
            </p>
          </div>

          <div className="mt-3 rounded-2xl border border-border/70 bg-surface-elevated px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Completed today</span>
              <span className="font-semibold text-foreground">{completedToday}/{habits.length || 0}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/70">
              <span
                className="block h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(8, Math.round(completionRatio * 100))}%` }}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {(["morning", "afternoon", "evening"] as DayBlock[]).map((block) => {
              const BlockIcon = dayBlockMeta[block].icon;
              const blockHabits = blockGroups[block];
              const blockCompleted = getBlockCompletionCount(blockHabits);

              return (
                <section key={block} className="rounded-3xl border border-border/60 bg-surface/75 p-3 shadow-[var(--card-shadow)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                        <BlockIcon size={16} /> {dayBlockMeta[block].title}
                      </h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">{dayBlockMeta[block].description}</p>
                    </div>
                    <span className="rounded-full bg-surface-elevated px-2 py-1 text-xs text-muted-foreground">
                      {blockCompleted}/{blockHabits.length || 0}
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
                            className="rounded-2xl border bg-surface-elevated px-3 py-3 transition-shadow duration-300"
                            style={{
                              borderColor: `${habit.color}66`,
                              boxShadow: `0 0 0 1px ${habit.color}1f, 0 14px 24px -20px ${habit.color}`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-foreground">{habit.title}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span
                                    className="inline-flex h-2.5 w-2.5 rounded-full border border-border/70"
                                    style={{ backgroundColor: habit.color }}
                                    aria-hidden="true"
                                  />
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
                                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border/70 bg-surface text-foreground transition hover:bg-primary/10"
                                  aria-label="Edit habit"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void removeHabit(habit.id);
                                  }}
                                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border/70 bg-surface text-foreground transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-200"
                                  aria-label="Delete habit"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{getFrequencyLabel(habit)}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  void toggleCompletionForDate(habit.id, today);
                                }}
                                className={
                                  completed
                                    ? "soft-glow-active inline-flex min-h-10 items-center gap-1 rounded-full bg-primary/20 px-3 text-xs font-semibold text-foreground"
                                    : "inline-flex min-h-10 items-center gap-1 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/10"
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
          <article className="wellness-card relative overflow-hidden rounded-[2rem] p-5">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
            <div className="absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Daily Action Plan</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Turn today&apos;s habit status into a practical plan you can execute.
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  reflectionHealth === "Ready"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                    : reflectionHealth === "Draft"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                      : "bg-surface-elevated text-muted-foreground"
                }`}
              >
                {reflectionHealth}
              </span>
            </div>

            <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-surface-elevated p-3 text-xs">
              <div>
                <p className="text-muted-foreground">Focus</p>
                <p className="mt-0.5 truncate font-semibold text-foreground">{focusHabit?.title ?? "None"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Momentum</p>
                <p className="mt-0.5 font-semibold text-foreground">{Math.round(completionRatio * 100)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Saved</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {reflectionSavedAt
                    ? new Date(reflectionSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "No"}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-3 rounded-2xl border border-border/70 bg-surface-elevated p-3 text-foreground">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                    <Bot size={13} /> AI Coach
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {aiInsight.risk} priority
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold">{aiInsight.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{aiInsight.suggestion}</p>
              <div className="mt-2 rounded-xl border border-border/60 bg-background/70 px-2.5 py-2 text-[11px] leading-relaxed text-foreground">
                Next move: {aiInsight.nextMove}
              </div>
              <button
                type="button"
                onClick={applyAiDraft}
                className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/10"
              >
                <Bot size={12} /> Generate action plan
              </button>
            </div>

            <div className="relative z-10 mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Plan Prompts</p>
              <div className="mt-2 grid gap-2">
                {reflectionPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => appendPrompt(prompt)}
                    className="rounded-xl border border-border/70 bg-surface-elevated px-3 py-2 text-left text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/10"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-3 rounded-2xl border border-border/70 bg-surface-elevated p-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s Action Plan</label>
              <textarea
                value={reflection}
                onChange={(event) => {
                  setReflection(event.target.value);
                  setReflectionDirty(true);
                }}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-border/70 bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-accent"
                placeholder="Write your plan: first step, priority order, blocker response, and one non-negotiable finish line."
              />

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{reflection.length}/280 characters</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearReflection}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground transition hover:bg-surface-elevated"
                  >
                    <Eraser size={12} /> Clear
                  </button>
                  <button
                    type="button"
                    onClick={saveReflection}
                    disabled={!reflectionDirty && hasReflection}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary/90 px-3 text-xs font-semibold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <BookmarkCheck size={12} /> Save plan
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      {modalMode ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Edit habit">
          <div className="wellness-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {modalMode === "edit" ? "Edit Habit" : "Add Habit"}
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  {modalMode === "edit" && editingHabit ? editingHabit.title : "Build a new routine"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-border/70 bg-surface-elevated text-foreground"
                aria-label="Close habit modal"
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

              <div className="rounded-2xl border border-border/70 bg-surface-elevated p-3 text-xs text-muted-foreground">
                <p
                  className="mb-2 h-1.5 rounded-full"
                  style={{ backgroundColor: selectedColor || "#1f6b4a" }}
                  aria-hidden="true"
                />
                Your selected color will glow on this habit card for quick visual scanning.
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
                    <option value="custom">Flexible days</option>
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
                    disabled={selectedFrequency === "daily"}
                    className="min-h-11 w-full rounded-2xl border border-border bg-surface-elevated px-3 text-sm"
                    {...register("targetDaysPerWeek")}
                  />
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {selectedFrequency === "daily"
                      ? "Daily habits are fixed at 7 days/week."
                      : "Set how many days per week this habit should happen."}
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary/85 px-4 text-sm font-semibold text-white"
                >
                  {modalMode === "edit" ? "Save changes" : "Add habit"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
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
