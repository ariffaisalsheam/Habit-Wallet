"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSubscriptionStore } from "@/features/subscription/store/use-subscription-store";
import { getStoredUserSession } from "@/lib/storage/session";

const subscriptionSchema = z.object({
  months: z.coerce.number().min(1).max(12),
  amount: z.coerce.number().min(99),
  senderNumber: z.string().min(11).max(14),
  transactionId: z.string().min(6).max(64),
});

type SubscriptionValues = z.input<typeof subscriptionSchema>;

function statusTone(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return "text-primary";
  if (status === "rejected") return "text-red-600";
  return "text-amber-600";
}

export function SubscriptionDashboard() {
  const session = getStoredUserSession();
  const requests = useSubscriptionStore((state) => state.requests);
  const submitRequest = useSubscriptionStore((state) => state.submitRequest);
  const loadMyRequests = useSubscriptionStore((state) => state.loadMyRequests);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const errorMessage = useSubscriptionStore((state) => state.errorMessage);
  const clearSubscriptionError = useSubscriptionStore((state) => state.clearSubscriptionError);

  useEffect(() => {
    if (!session) return;
    void loadMyRequests();
  }, [loadMyRequests, session]);

  useEffect(() => {
    if (!errorMessage) return;

    const timer = window.setTimeout(() => {
      clearSubscriptionError();
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [clearSubscriptionError, errorMessage]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      months: 1,
      amount: 199,
      senderNumber: "",
      transactionId: "",
    },
  });

  const myRequests = useMemo(() => {
    if (!session) return [];
    return requests.filter((item) => item.userId === session.user_id);
  }, [requests, session]);

  const activeSubscription = useMemo(() => {
    const approved = myRequests.find((request) => request.status === "approved");
    if (!approved) return null;

    const start = approved.reviewedAt ? new Date(approved.reviewedAt) : new Date(approved.submittedAt);
    const end = new Date(start);
    end.setMonth(end.getMonth() + approved.months);

    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  }, [myRequests]);

  const onSubmit = handleSubmit(async (values) => {
    if (!session) {
      return;
    }

    await submitRequest(
      {
        amount: Number(values.amount),
        months: Number(values.months),
        senderNumber: values.senderNumber.trim(),
        transactionId: values.transactionId.trim(),
      },
      {
        userId: session.user_id,
        userName: session.name,
        userEmail: session.email,
      }
    );

    reset({
      months: values.months,
      amount: values.amount,
      senderNumber: "",
      transactionId: "",
    });
  });

  if (!session) {
    return (
      <section className="rounded-[2rem] border border-border/80 bg-surface p-5 shadow-[var(--soft-shadow)]">
        <h2 className="text-xl font-semibold text-foreground">Subscription</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to request HabitWallet Pro activation.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 pb-8">
      <article className="wellness-card rounded-[2rem] p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">HabitWallet Pro</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Manual bKash activation</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Send payment to <span className="font-semibold text-foreground">01XXXXXXXXX</span>, then submit your bKash transaction ID below.
        </p>

        {activeSubscription ? (
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-foreground">
            <CheckCircle2 size={13} /> Pro active until {activeSubscription.end}
          </p>
        ) : (
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            <ShieldAlert size={13} /> Free tier active
          </p>
        )}
      </article>

      <article className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
        <h3 className="text-base font-semibold text-foreground">Submit payment request</h3>

        <form className="mt-3 space-y-3" onSubmit={onSubmit} noValidate>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Plan duration (months)</span>
              <input
                type="number"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                {...register("months")}
              />
              {errors.months ? <span className="mt-1 block text-xs text-red-600">{errors.months.message}</span> : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount (BDT)</span>
              <input
                type="number"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                {...register("amount")}
              />
              {errors.amount ? <span className="mt-1 block text-xs text-red-600">{errors.amount.message}</span> : null}
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">bKash sender number</span>
            <input
              type="text"
              placeholder="01XXXXXXXXX"
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              {...register("senderNumber")}
            />
            {errors.senderNumber ? (
              <span className="mt-1 block text-xs text-red-600">{errors.senderNumber.message}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">bKash transaction ID</span>
            <input
              type="text"
              placeholder="e.g. A7K2LM91"
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              {...register("transactionId")}
            />
            {errors.transactionId ? (
              <span className="mt-1 block text-xs text-red-600">{errors.transactionId.message}</span>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
          >
            {isLoading ? "Submitting..." : "Submit for approval"}
          </button>

          {errorMessage ? <p className="rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-800">{errorMessage}</p> : null}
        </form>
      </article>

      <article className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
        <h3 className="text-base font-semibold text-foreground">Your requests</h3>
        <ul className="mt-3 space-y-2">
          {myRequests.length === 0 ? (
            <li className="rounded-xl bg-background px-3 py-3 text-sm text-muted-foreground">
              No requests yet. Submit your first payment request above.
            </li>
          ) : (
            myRequests.map((request) => (
              <li key={request.id} className="rounded-xl border border-border/70 bg-background px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {request.months} month · BDT {request.amount}
                  </p>
                  <p className={`text-xs font-semibold uppercase ${statusTone(request.status)}`}>{request.status}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Txn: {request.transactionId}</p>
                <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Clock3 size={11} /> Submitted {new Date(request.submittedAt).toLocaleString()}
                </p>
                {request.adminNote ? (
                  <p className="mt-2 rounded-lg bg-surface px-2 py-1 text-xs text-muted-foreground">Admin note: {request.adminNote}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
