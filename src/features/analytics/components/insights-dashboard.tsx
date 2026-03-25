"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Download,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { HabitCompletion } from "@/features/habits/types";
import { useHabitsStore } from "@/features/habits/store/use-habits-store";
import { useTransactionsStore } from "@/features/finance/store/use-transactions-store";
import { formatBDT } from "@/features/finance/utils";
import { exportInsightsPdf } from "@/features/analytics/utils";

type InsightWindow = 7 | 30 | 90;

type DailyProgress = {
  date: string;
  completed: number;
  total: number;
};

type ProgressPoint = {
  label: string;
  completed: number;
  total: number;
};

const insightWindows: InsightWindow[] = [7, 30, 90];

function getLastNDates(n: number) {
  const dates: string[] = [];
  const cursor = new Date();

  for (let i = 0; i < n; i += 1) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() - (n - 1 - i));
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

function uniqueCompletionsByDate(completions: HabitCompletion[]) {
  const completedByDate = new Map<string, Set<string>>();

  completions.forEach((completion) => {
    const set = completedByDate.get(completion.completionDate) ?? new Set<string>();
    set.add(completion.habitId);
    completedByDate.set(completion.completionDate, set);
  });

  return completedByDate;
}

function shortDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

function shortMonthDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
  });
}

function buildProgressPoints(windowProgress: DailyProgress[], windowDays: InsightWindow): ProgressPoint[] {
  if (windowDays === 7) {
    return windowProgress.map((day) => ({
      label: shortDay(day.date),
      completed: day.completed,
      total: day.total,
    }));
  }

  const bucketSize = 7;
  const buckets: ProgressPoint[] = [];

  for (let i = 0; i < windowProgress.length; i += bucketSize) {
    const chunk = windowProgress.slice(i, i + bucketSize);
    if (chunk.length === 0) {
      continue;
    }

    const completed = chunk.reduce((sum, day) => sum + day.completed, 0);
    const total = chunk.reduce((sum, day) => sum + day.total, 0);
    const startLabel = shortMonthDay(chunk[0].date);
    const endLabel = shortMonthDay(chunk[chunk.length - 1].date);

    buckets.push({
      label: `${startLabel}-${endLabel}`,
      completed,
      total,
    });
  }

  return buckets;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWindowBounds(windowDays: InsightWindow) {
  const today = startOfDay(new Date());
  const currentStart = new Date(today);
  currentStart.setDate(today.getDate() - (windowDays - 1));

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(currentStart.getDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - (windowDays - 1));

  return {
    currentStart,
    currentEnd: today,
    previousStart,
    previousEnd,
  };
}

function inRange(dateValue: string, start: Date, end: Date) {
  const date = startOfDay(new Date(`${dateValue}T00:00:00`));
  return date >= start && date <= end;
}

function formatDelta(current: number, previous: number, suffix = "%") {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}${suffix} vs prev`;
}

export function InsightsDashboard() {
  const [windowDays, setWindowDays] = useState<InsightWindow>(7);
  const habits = useHabitsStore((state) => state.habits);
  const completions = useHabitsStore((state) => state.completions);
  const transactions = useTransactionsStore((state) => state.transactions);

  const windowBounds = useMemo(() => getWindowBounds(windowDays), [windowDays]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const windowProgress = useMemo<DailyProgress[]>(() => {
    const dates = getLastNDates(windowDays);
    const completedByDate = uniqueCompletionsByDate(completions);

    return dates.map((date) => {
      const completedSet = completedByDate.get(date) ?? new Set<string>();

      return {
        date,
        completed: completedSet.size,
        total: habits.length,
      };
    });
  }, [completions, habits.length, windowDays]);

  const completionRate = useMemo(() => {
    const totalPossible = windowProgress.reduce((sum, day) => sum + day.total, 0);
    const totalDone = windowProgress.reduce((sum, day) => sum + day.completed, 0);

    if (totalPossible === 0) {
      return 0;
    }

    return Math.round((totalDone / totalPossible) * 100);
  }, [windowProgress]);

  const progressPoints = useMemo(
    () => buildProgressPoints(windowProgress, windowDays),
    [windowProgress, windowDays]
  );

  const previousCompletionRate = useMemo(() => {
    if (habits.length === 0) {
      return 0;
    }

    const completedByDate = uniqueCompletionsByDate(completions);
    let done = 0;

    for (let cursor = new Date(windowBounds.previousStart); cursor <= windowBounds.previousEnd; cursor.setDate(cursor.getDate() + 1)) {
      const dateKey = cursor.toISOString().slice(0, 10);
      done += completedByDate.get(dateKey)?.size ?? 0;
    }

    const possible = habits.length * windowDays;
    return possible ? Math.round((done / possible) * 100) : 0;
  }, [completions, habits.length, windowBounds.previousEnd, windowBounds.previousStart, windowDays]);

  const periodFinancials = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "income") {
          if (inRange(transaction.date, windowBounds.currentStart, windowBounds.currentEnd)) {
            acc.currentIncome += transaction.amount;
          }

          if (inRange(transaction.date, windowBounds.previousStart, windowBounds.previousEnd)) {
            acc.previousIncome += transaction.amount;
          }

          return acc;
        }

        if (inRange(transaction.date, windowBounds.currentStart, windowBounds.currentEnd)) {
          acc.currentExpense += transaction.amount;
        }

        if (inRange(transaction.date, windowBounds.previousStart, windowBounds.previousEnd)) {
          acc.previousExpense += transaction.amount;
        }

        return acc;
      },
      {
        currentIncome: 0,
        previousIncome: 0,
        currentExpense: 0,
        previousExpense: 0,
      }
    );
  }, [transactions, windowBounds.currentEnd, windowBounds.currentStart, windowBounds.previousEnd, windowBounds.previousStart]);

  const spendingDeltaPercent = useMemo(() => {
    if (periodFinancials.previousExpense === 0) {
      return periodFinancials.currentExpense === 0 ? 0 : 100;
    }

    return Math.round(
      ((periodFinancials.currentExpense - periodFinancials.previousExpense) / periodFinancials.previousExpense) * 100
    );
  }, [periodFinancials.currentExpense, periodFinancials.previousExpense]);

  const monthFinancials = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (!transaction.date.startsWith(currentMonth)) {
          return acc;
        }

        if (transaction.type === "income") {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
          acc.expenseCount += 1;
        }

        return acc;
      },
      { income: 0, expense: 0, expenseCount: 0 }
    );
  }, [currentMonth, transactions]);

  const monthBalance = monthFinancials.income - monthFinancials.expense;
  const savingsRate = monthFinancials.income
    ? Math.max(0, Math.round((monthBalance / monthFinancials.income) * 100))
    : 0;

  const previousSavingsRate = useMemo(() => {
    const previousMonthDate = new Date();
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
    const previousMonth = previousMonthDate.toISOString().slice(0, 7);

    const previousMonthFinancials = transactions.reduce(
      (acc, transaction) => {
        if (!transaction.date.startsWith(previousMonth)) {
          return acc;
        }

        if (transaction.type === "income") {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }

        return acc;
      },
      { income: 0, expense: 0 }
    );

    const previousMonthBalance = previousMonthFinancials.income - previousMonthFinancials.expense;
    return previousMonthFinancials.income
      ? Math.max(0, Math.round((previousMonthBalance / previousMonthFinancials.income) * 100))
      : 0;
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const grouped = transactions.reduce<Record<string, number>>((acc, transaction) => {
      if (transaction.type !== "expense") {
        return acc;
      }

      if (!transaction.date.startsWith(currentMonth)) {
        return acc;
      }

      const key = transaction.category.trim() || "Other";
      acc[key] = (acc[key] ?? 0) + transaction.amount;

      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [currentMonth, transactions]);

  const topExpense = expenseByCategory[0];

  function onExportInsightsPdf() {
    exportInsightsPdf({
      windowDays,
      completionRate,
      previousCompletionRate,
      savingsRate,
      previousSavingsRate,
      spendingDeltaPercent,
      topExpenseLabel: topExpense ? topExpense[0] : "No expense data",
      progressPoints,
      monthlyFinancials: {
        income: monthFinancials.income,
        expense: monthFinancials.expense,
      },
      monthlyBalance: monthBalance,
      topExpenseCategories: expenseByCategory,
    });
  }

  return (
    <section className="space-y-4 pb-8 animate-soft-rise">
      <article className="wellness-card rounded-[2rem] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Insight Pulse</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Your momentum snapshot</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex rounded-full border border-border/80 bg-background/80 p-1">
              {insightWindows.map((windowOption) => (
                <button
                  key={windowOption}
                  type="button"
                  onClick={() => setWindowDays(windowOption)}
                  className={`inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition ${
                    windowDays === windowOption
                      ? "bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                  }`}
                >
                  <CalendarRange size={13} /> {windowOption}D
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onExportInsightsPdf}
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border/80 bg-background/90 px-3 text-xs font-semibold text-foreground hover:bg-surface-elevated"
            >
              <Download size={13} /> Export PDF
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-background/90 p-3">
            <p className="text-xs text-muted-foreground">Habit consistency</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{completionRate}%</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              {completionRate >= previousCompletionRate ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {formatDelta(completionRate, previousCompletionRate)}
            </p>
          </div>
          <div className="rounded-2xl bg-background/90 p-3">
            <p className="text-xs text-muted-foreground">Monthly savings rate</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{savingsRate}%</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              {savingsRate >= previousSavingsRate ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {formatDelta(savingsRate, previousSavingsRate)}
            </p>
          </div>
          <div className="rounded-2xl bg-background/90 p-3">
            <p className="text-xs text-muted-foreground">Top expense focus</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{topExpense ? topExpense[0] : "No expense data"}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {spendingDeltaPercent > 0 ? "+" : ""}
              {spendingDeltaPercent}% spend vs previous {windowDays} days
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
        <h3 className="text-base font-semibold text-foreground">Habit rhythm by day</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {windowDays === 7
            ? "A calm look at each day."
            : `Weekly rhythm across the last ${windowDays} days.`}
        </p>

        <div
          className="mt-4 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.max(progressPoints.length, 1)}, minmax(0, 1fr))` }}
        >
          {progressPoints.map((point) => {
            const ratio = point.total ? point.completed / point.total : 0;
            const levelClass =
              ratio >= 0.75
                ? "bg-primary/90"
                : ratio >= 0.4
                  ? "bg-primary/55"
                  : ratio > 0
                    ? "bg-primary/30"
                    : "bg-border";

            return (
              <div key={point.label} className="space-y-1 text-center">
                <p className="text-[10px] font-medium text-muted-foreground">{point.label}</p>
                <div className={`mx-auto h-16 w-full max-w-[2.2rem] rounded-xl ${levelClass}`} />
                <p className="text-[10px] text-muted-foreground">
                  {point.completed}/{point.total || 0}
                </p>
              </div>
            );
          })}
        </div>
      </article>

      <article className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
            {monthBalance >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />} Monthly cash flow
          </h3>
          <p className="mt-2 text-xs text-muted-foreground">Current month snapshot</p>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
              <span className="text-muted-foreground">Income</span>
              <span className="font-semibold text-foreground">{formatBDT(monthFinancials.income)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
              <span className="text-muted-foreground">Expense</span>
              <span className="font-semibold text-foreground">{formatBDT(monthFinancials.expense)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-semibold text-foreground">{formatBDT(monthBalance)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
            <PiggyBank size={16} /> Expense categories
          </h3>
          <p className="mt-2 text-xs text-muted-foreground">Top spending buckets this month</p>

          <ul className="mt-3 space-y-2">
            {expenseByCategory.length === 0 ? (
              <li className="rounded-xl bg-background px-3 py-3 text-sm text-muted-foreground">No expense data available yet.</li>
            ) : (
              expenseByCategory.map(([category, amount]) => {
                const percent = monthFinancials.expense ? Math.round((amount / monthFinancials.expense) * 100) : 0;

                return (
                  <li key={category} className="rounded-xl bg-background px-3 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{category}</span>
                      <span className="text-muted-foreground">{formatBDT(amount)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/90">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </article>

      <article className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
        <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <Target size={16} /> Gentle next step
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {habits.length === 0
            ? "Add one tiny habit to begin your momentum journey."
            : completionRate < 50
              ? "Pick one habit and protect a consistent time block for three days in a row."
              : "Your rhythm is strong. Consider raising one habit target slightly next week."}
        </p>
      </article>
    </section>
  );
}
