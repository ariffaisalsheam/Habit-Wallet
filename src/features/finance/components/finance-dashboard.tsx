"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Crown, Download, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useBudgetsStore } from "@/features/finance/store/use-budgets-store";
import { useTransactionsStore } from "@/features/finance/store/use-transactions-store";
import type { FinanceTransaction, TransactionInput } from "@/features/finance/types";
import { exportTransactionsPdf, formatBDT, formatDate, getCurrentMonthTotals } from "@/features/finance/utils";
import { getOrCreateUserProfile } from "@/lib/profile/service";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(2, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.string(),
  description: z.string().max(120, "Description must be under 120 chars"),
});

const budgetSchema = z.object({
  category: z.string().min(2, "Category is required"),
  limitAmount: z.coerce.number().positive("Budget must be greater than zero"),
});

type TransactionValues = z.input<typeof transactionSchema>;
type BudgetValues = z.input<typeof budgetSchema>;

function toFormValues(transaction: FinanceTransaction): TransactionValues {
  return {
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    date: transaction.date,
    description: transaction.description,
  };
}

export function FinanceDashboard() {
  const currentDate = new Date().toISOString().slice(0, 10);
  const currentMonth = currentDate.slice(0, 7);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro">("free");
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const transactions = useTransactionsStore((state) => state.transactions);
  const addTransaction = useTransactionsStore((state) => state.addTransaction);
  const updateTransaction = useTransactionsStore((state) => state.updateTransaction);
  const deleteTransaction = useTransactionsStore((state) => state.deleteTransaction);
  const loadTransactions = useTransactionsStore((state) => state.loadFromBackend);
  const transactionsSyncing = useTransactionsStore((state) => state.syncing);
  const transactionsPendingQueueCount = useTransactionsStore((state) => state.pendingQueueCount);
  const syncPendingTransactions = useTransactionsStore((state) => state.syncPending);
  const transactionsError = useTransactionsStore((state) => state.errorMessage);
  const clearTransactionsError = useTransactionsStore((state) => state.clearTransactionsError);
  const budgets = useBudgetsStore((state) => state.budgets);
  const upsertBudget = useBudgetsStore((state) => state.upsertBudget);
  const deleteBudget = useBudgetsStore((state) => state.deleteBudget);
  const loadBudgets = useBudgetsStore((state) => state.loadFromBackend);
  const budgetsSyncing = useBudgetsStore((state) => state.syncing);
  const budgetsPendingQueueCount = useBudgetsStore((state) => state.pendingQueueCount);
  const syncPendingBudgets = useBudgetsStore((state) => state.syncPending);
  const budgetsError = useBudgetsStore((state) => state.errorMessage);
  const clearBudgetsError = useBudgetsStore((state) => state.clearBudgetsError);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      category: "",
      amount: 0,
      date: currentDate,
      description: "",
    },
  });

  const {
    register: registerBudget,
    handleSubmit: handleSubmitBudget,
    reset: resetBudget,
    formState: { errors: budgetErrors, isSubmitting: isBudgetSubmitting },
  } = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: "",
      limitAmount: 0,
    },
  });

  const totals = useMemo(() => getCurrentMonthTotals(transactions), [transactions]);
  const balance = totals.income - totals.expense;
  const isPro = subscriptionTier === "pro";
  const pendingSyncCount = transactionsPendingQueueCount + budgetsPendingQueueCount;
  const isSyncingAny = transactionsSyncing || budgetsSyncing;

  useEffect(() => {
    void loadTransactions();
    void loadBudgets();
  }, [loadBudgets, loadTransactions]);

  useEffect(() => {
    let mounted = true;

    void getOrCreateUserProfile()
      .then((profile) => {
        if (!mounted) return;
        setSubscriptionTier(profile.subscriptionTier);
      })
      .catch(() => {
        if (!mounted) return;
        setSubscriptionTier("free");
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!transactionsError) return;
    const timer = window.setTimeout(() => clearTransactionsError(), 4500);
    return () => window.clearTimeout(timer);
  }, [clearTransactionsError, transactionsError]);

  useEffect(() => {
    if (!budgetsError) return;
    const timer = window.setTimeout(() => clearBudgetsError(), 4500);
    return () => window.clearTimeout(timer);
  }, [budgetsError, clearBudgetsError]);

  useEffect(() => {
    if (!upgradeNotice) return;
    const timer = window.setTimeout(() => setUpgradeNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [upgradeNotice]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const monthBudgets = budgets.filter((budget) => budget.monthYear === currentMonth);

  const categorySpending = transactions.reduce<Record<string, number>>((acc, transaction) => {
    if (transaction.type !== "expense") {
      return acc;
    }

    if (!transaction.date.startsWith(currentMonth)) {
      return acc;
    }

    const key = transaction.category.toLowerCase();
    acc[key] = (acc[key] ?? 0) + transaction.amount;
    return acc;
  }, {});

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null);

    const payload: TransactionInput = {
      type: values.type,
      category: values.category.trim(),
      amount: Number(values.amount),
      date: values.date || currentDate,
      description: values.description.trim(),
    };

    if (editingId) {
      await updateTransaction(editingId, payload);
      setEditingId(null);
      setSuccessMessage("Transaction updated successfully.");
    } else {
      await addTransaction(payload);
      setSuccessMessage("Transaction added successfully.");
    }

    reset({
      type: "expense",
      category: "",
      amount: 0,
      date: currentDate,
      description: "",
    });
  });

  function onEdit(transaction: FinanceTransaction) {
    setEditingId(transaction.id);
    reset(toFormValues(transaction));
  }

  function onCancelEdit() {
    setEditingId(null);
    reset({
      type: "expense",
      category: "",
      amount: 0,
      date: currentDate,
      description: "",
    });
  }

  const onSubmitBudget = handleSubmitBudget(async (values) => {
    setSuccessMessage(null);

    await upsertBudget({
      monthYear: currentMonth,
      category: values.category.trim(),
      limitAmount: Number(values.limitAmount),
    });

    resetBudget({
      category: "",
      limitAmount: 0,
    });

    setSuccessMessage("Budget saved successfully.");
  });

  async function handleSyncNow() {
    await Promise.allSettled([syncPendingTransactions(), syncPendingBudgets()]);
  }

  return (
    <section className="space-y-4 pb-8">
      {isSyncingAny ? (
        <p className="text-xs text-muted-foreground">Syncing finance data...</p>
      ) : null}
      {pendingSyncCount > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p>{pendingSyncCount} change(s) queued for cloud sync.</p>
          <button
            type="button"
            onClick={() => {
              void handleSyncNow();
            }}
            disabled={isSyncingAny}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 font-semibold text-amber-900 disabled:opacity-60"
          >
            <RefreshCw size={13} /> Sync now
          </button>
        </div>
      ) : null}
      {transactionsError ? <p className="rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-800">{transactionsError}</p> : null}
      {budgetsError ? <p className="rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-800">{budgetsError}</p> : null}
      {successMessage ? (
        <p className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800">{successMessage}</p>
      ) : null}

      <article className="grid grid-cols-3 gap-2 rounded-3xl border border-border bg-surface p-3">
        <div className="rounded-2xl bg-primary/10 p-2">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="mt-1 text-sm font-bold text-foreground">{formatBDT(totals.income)}</p>
        </div>
        <div className="rounded-2xl bg-secondary/10 p-2">
          <p className="text-xs text-muted-foreground">Expense</p>
          <p className="mt-1 text-sm font-bold text-foreground">{formatBDT(totals.expense)}</p>
        </div>
        <div className="rounded-2xl bg-accent/20 p-2">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="mt-1 text-sm font-bold text-foreground">{formatBDT(balance)}</p>
        </div>
      </article>

      <article className="rounded-3xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">
          {editingId ? "Edit transaction" : "Add transaction"}
        </h2>

        <form className="mt-3 space-y-3" onSubmit={onSubmit} noValidate>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Type</span>
              <select
                className="app-select min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                {...register("type")}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Date</span>
              <input
                type="date"
                className="app-date min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                {...register("date")}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Category</span>
            <input
              type="text"
              placeholder="e.g. Food, Salary, Transport"
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              {...register("category")}
            />
            {errors.category ? <span className="mt-1 block text-xs text-red-600">{errors.category.message}</span> : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount (BDT)</span>
            <input
              type="number"
              step="0.01"
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              {...register("amount")}
            />
            {errors.amount ? <span className="mt-1 block text-xs text-red-600">{errors.amount.message}</span> : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Description</span>
            <input
              type="text"
              placeholder="Optional note"
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              {...register("description")}
            />
            {errors.description ? (
              <span className="mt-1 block text-xs text-red-600">{errors.description.message}</span>
            ) : null}
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
            >
              {editingId ? "Update" : "Add"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </article>

      <article className="rounded-3xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">Monthly category budgets</h2>
        <p className="mt-1 text-xs text-muted-foreground">Tracking month: {currentMonth}</p>

        <form className="mt-3 space-y-3" onSubmit={onSubmitBudget} noValidate>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Category</span>
              <input
                type="text"
                placeholder="e.g. Food"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                {...registerBudget("category")}
              />
              {budgetErrors.category ? (
                <span className="mt-1 block text-xs text-red-600">{budgetErrors.category.message}</span>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Limit (BDT)</span>
              <input
                type="number"
                step="0.01"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                {...registerBudget("limitAmount")}
              />
              {budgetErrors.limitAmount ? (
                <span className="mt-1 block text-xs text-red-600">{budgetErrors.limitAmount.message}</span>
              ) : null}
            </label>
          </div>

          <button
            type="submit"
            disabled={isBudgetSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
          >
            Save budget
          </button>
        </form>

        <ul className="mt-4 space-y-2">
          {monthBudgets.length === 0 ? (
            <li className="rounded-2xl bg-background px-3 py-4 text-sm text-muted-foreground">
              No budgets set for this month yet.
            </li>
          ) : (
            monthBudgets.map((budget) => {
              const spent = categorySpending[budget.category.toLowerCase()] ?? 0;
              const progress = Math.min((spent / budget.limitAmount) * 100, 100);
              const isOverspent = spent > budget.limitAmount;

              return (
                <li key={budget.id} className="rounded-2xl border border-border/70 bg-background px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{budget.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBDT(spent)} / {formatBDT(budget.limitAmount)}
                      </p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border/80">
                        <div
                          className={isOverspent ? "h-full bg-red-500" : "h-full bg-primary"}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {isOverspent ? (
                        <p className="mt-1 text-xs font-semibold text-red-600">Overspent this month</p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        void deleteBudget(budget.id);
                      }}
                      className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border border-border text-foreground"
                      aria-label="Delete budget"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </article>

      <article className="rounded-3xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent transactions</h2>
          <button
            type="button"
            onClick={async () => {
              if (!isPro) {
                setUpgradeNotice("Finance PDF export is available on the Professional plan.");
                return;
              }
              exportTransactionsPdf(transactions);
            }}
            disabled={transactions.length === 0}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-3 text-xs font-semibold text-foreground disabled:opacity-50"
          >
            <Download size={15} /> PDF
          </button>
        </div>
        {!isPro ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Crown size={11} className="text-amber-500" />
            Professional unlocks PDF export.
            <Link href="/subscription" className="font-semibold text-primary hover:underline">
              Upgrade
            </Link>
          </p>
        ) : null}
        {upgradeNotice ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {upgradeNotice}
          </p>
        ) : null}

        <ul className="mt-3 space-y-2">
          {transactions.length === 0 ? (
            <li className="rounded-2xl bg-background px-3 py-4 text-sm text-muted-foreground">
              No transactions yet. Add your first one above.
            </li>
          ) : (
            transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="rounded-2xl border border-border/70 bg-background px-3 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{transaction.category}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                    {transaction.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{transaction.description}</p>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <p className={transaction.type === "income" ? "text-sm font-bold text-primary" : "text-sm font-bold text-secondary"}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatBDT(transaction.amount)}
                    </p>
                    <div className="mt-1 flex gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(transaction)}
                        className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border border-border text-foreground"
                        aria-label="Edit transaction"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void deleteTransaction(transaction.id);
                        }}
                        className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border border-border text-foreground"
                        aria-label="Delete transaction"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
