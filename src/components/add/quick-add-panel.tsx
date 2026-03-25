"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTransactionsStore } from "@/features/finance/store/use-transactions-store";
import { useHabitsStore } from "@/features/habits/store/use-habits-store";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(2, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.string(),
  description: z.string().max(120, "Description must be under 120 chars"),
});

const habitSchema = z.object({
  title: z.string().min(2, "Habit title is required"),
  category: z.string().min(2, "Category is required"),
  color: z.string().min(4),
  frequency: z.enum(["daily", "weekly", "custom"]),
  timeBlock: z.enum(["morning", "afternoon", "evening"]),
  targetDaysPerWeek: z.coerce.number().min(1).max(7),
});

type TransactionValues = z.input<typeof transactionSchema>;
type HabitValues = z.input<typeof habitSchema>;

export function QuickAddPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState<"transaction" | "habit">("transaction");
  const [message, setMessage] = useState<string | null>(null);

  const addTransaction = useTransactionsStore((state) => state.addTransaction);
  const addHabit = useHabitsStore((state) => state.addHabit);

  const {
    register: registerTransaction,
    handleSubmit: handleTransactionSubmit,
    reset: resetTransaction,
    formState: { errors: transactionErrors, isSubmitting: transactionSubmitting },
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      category: "",
      amount: 0,
      date: today,
      description: "",
    },
  });

  const {
    register: registerHabit,
    handleSubmit: handleHabitSubmit,
    reset: resetHabit,
    formState: { errors: habitErrors, isSubmitting: habitSubmitting },
  } = useForm<HabitValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: "",
      category: "Health",
      color: "#1f6b4a",
      frequency: "daily",
      timeBlock: "morning",
      targetDaysPerWeek: 7,
    },
  });

  const submitTransaction = handleTransactionSubmit(async (values) => {
    setMessage(null);

    addTransaction({
      type: values.type,
      category: values.category.trim(),
      amount: Number(values.amount),
      date: values.date || today,
      description: values.description.trim(),
    });

    resetTransaction({
      type: "expense",
      category: "",
      amount: 0,
      date: today,
      description: "",
    });

    setMessage("Transaction added.");
  });

  const submitHabit = handleHabitSubmit(async (values) => {
    setMessage(null);

    addHabit({
      title: values.title.trim(),
      category: values.category.trim(),
      color: values.color,
      frequency: values.frequency,
      timeBlock: values.timeBlock,
      targetDaysPerWeek: Number(values.targetDaysPerWeek),
    });

    resetHabit({
      title: "",
      category: "Health",
      color: "#1f6b4a",
      frequency: "daily",
      timeBlock: "morning",
      targetDaysPerWeek: 7,
    });

    setMessage("Habit added.");
  });

  return (
    <section className="space-y-4 pb-8">
      <article className="rounded-3xl border border-border bg-surface p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quick Add</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">Create in one tap</h2>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("transaction")}
            className={clsx(
              "min-h-11 rounded-xl border px-3 text-sm font-semibold",
              mode === "transaction"
                ? "border-primary bg-primary text-white"
                : "border-border bg-background text-foreground"
            )}
          >
            Transaction
          </button>
          <button
            type="button"
            onClick={() => setMode("habit")}
            className={clsx(
              "min-h-11 rounded-xl border px-3 text-sm font-semibold",
              mode === "habit"
                ? "border-primary bg-primary text-white"
                : "border-border bg-background text-foreground"
            )}
          >
            Habit
          </button>
        </div>
      </article>

      {mode === "transaction" ? (
        <article className="rounded-3xl border border-border bg-surface p-4">
          <form className="space-y-3" onSubmit={submitTransaction} noValidate>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Type</span>
                <select
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  {...registerTransaction("type")}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Date</span>
                <input
                  type="date"
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  {...registerTransaction("date")}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Category</span>
              <input
                type="text"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                placeholder="e.g. Food"
                {...registerTransaction("category")}
              />
              {transactionErrors.category ? (
                <span className="mt-1 block text-xs text-red-600">{transactionErrors.category.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount (BDT)</span>
              <input
                type="number"
                step="0.01"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                {...registerTransaction("amount")}
              />
              {transactionErrors.amount ? (
                <span className="mt-1 block text-xs text-red-600">{transactionErrors.amount.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Description</span>
              <input
                type="text"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                placeholder="Optional note"
                {...registerTransaction("description")}
              />
            </label>

            <button
              type="submit"
              disabled={transactionSubmitting}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
            >
              Add transaction
            </button>
          </form>
        </article>
      ) : (
        <article className="rounded-3xl border border-border bg-surface p-4">
          <form className="space-y-3" onSubmit={submitHabit} noValidate>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Habit title</span>
              <input
                type="text"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                placeholder="e.g. Walk 20 min"
                {...registerHabit("title")}
              />
              {habitErrors.title ? (
                <span className="mt-1 block text-xs text-red-600">{habitErrors.title.message}</span>
              ) : null}
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Category</span>
                <input
                  type="text"
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  {...registerHabit("category")}
                />
                {habitErrors.category ? (
                  <span className="mt-1 block text-xs text-red-600">{habitErrors.category.message}</span>
                ) : null}
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Color</span>
                <input
                  type="color"
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-2"
                  {...registerHabit("color")}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Frequency</span>
                <select
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  {...registerHabit("frequency")}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Time block</span>
                <select
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  {...registerHabit("timeBlock")}
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
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  {...registerHabit("targetDaysPerWeek")}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={habitSubmitting}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
            >
              Add habit
            </button>
          </form>
        </article>
      )}

      {message ? <p className="rounded-xl bg-green-100 px-3 py-2 text-sm text-green-800">{message}</p> : null}
    </section>
  );
}
