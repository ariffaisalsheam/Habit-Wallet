"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Crown,
  ExternalLink,
  Info,
  Loader2,
  Smartphone,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSubscriptionStore } from "@/features/subscription/store/use-subscription-store";
import { SUBSCRIPTION_PLANS } from "@/features/subscription/plans";
import { getStoredUserSession, USER_SESSION_EVENT } from "@/lib/storage/session";
import { useConfigStore } from "@/lib/config/use-config-store";
import { getOrCreateUserProfile } from "@/lib/profile/service";

const subscriptionSchema = z.object({
  months: z.coerce.number().min(1).max(12),
  amount: z.coerce.number().min(1),
  senderNumber: z.string().min(11).max(14),
  transactionId: z.string().min(6).max(64),
});

type SubscriptionValues = z.input<typeof subscriptionSchema>;

// BKASH_STEPS moved inside component hook

function statusConfig(status: "pending" | "approved" | "rejected") {
  if (status === "approved")
    return {
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50",
      icon: CheckCircle2,
      label: "Approved",
    };
  if (status === "rejected")
    return {
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50",
      icon: XCircle,
      label: "Rejected",
    };
  return {
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50",
    icon: Clock3,
    label: "Pending Review",
  };
}

type PlanCardProps = {
  name: string;
  price: string;
  period: string;
  features: string[];
  isActive: boolean;
  isPro?: boolean;
  tag?: string;
  ctaLabel?: string;
  ctaMuted?: boolean;
  onSelect?: () => void;
};

function PlanCard({
  name,
  price,
  period,
  features,
  isActive,
  isPro,
  tag,
  ctaLabel,
  ctaMuted,
  onSelect,
}: PlanCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 transition-all duration-200 ${
        isPro
          ? "border-primary/40 bg-gradient-to-br from-primary/5 via-surface to-accent/5 shadow-[var(--card-shadow)]"
          : "border-border/60 bg-surface"
      } ${isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
    >
      {tag && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow">
          {tag}
        </span>
      )}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            {isPro && <Crown size={14} className="text-amber-500" />}
            <p className="text-sm font-semibold text-foreground">{name}</p>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">৳{price}</span>
            <span className="text-xs text-muted-foreground">/ {period}</span>
          </div>
        </div>
        {isActive && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">Active</span>
        )}
      </div>

      <ul className="mb-5 flex-1 space-y-2">
        {features.map((feat) => (
          <li key={feat} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2
              size={13}
              className={`mt-0.5 shrink-0 ${isPro ? "text-primary" : "text-muted-foreground/60"}`}
            />
            {feat}
          </li>
        ))}
      </ul>

      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className={`inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all ${
            ctaMuted
              ? "border border-border bg-surface-elevated text-muted-foreground"
              : isPro
              ? "bg-primary text-white hover:bg-primary/90"
              : "border border-border bg-surface text-foreground hover:bg-background"
          }`}
        >
          {isPro && !ctaMuted ? <Zap size={14} /> : null}
          {ctaLabel ?? (isPro ? "Upgrade to Professional" : "Current Plan")}
          {isPro && !ctaMuted ? <ChevronRight size={14} /> : null}
        </button>
      ) : null}
    </div>
  );
}

function subscribeToSession(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(USER_SESSION_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(USER_SESSION_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function SubscriptionDashboard() {
  const session = useSyncExternalStore(subscribeToSession, getStoredUserSession, () => null);
  const requests = useSubscriptionStore((state) => state.requests);
  const submitRequest = useSubscriptionStore((state) => state.submitRequest);
  const loadMyRequests = useSubscriptionStore((state) => state.loadMyRequests);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const errorMessage = useSubscriptionStore((state) => state.errorMessage);
  const clearSubscriptionError = useSubscriptionStore((state) => state.clearSubscriptionError);
  
  const { config, loadConfig } = useConfigStore();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [copiedBkash, setCopiedBkash] = useState(false);
  const [profileTier, setProfileTier] = useState<"free" | "pro">("free");
  const [profileEndDate, setProfileEndDate] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const BKASH_STEPS = useMemo(() => [
    { step: 1, icon: Smartphone, title: "Open bKash", desc: "Launch the bKash app on your phone" },
    { step: 2, icon: Wallet, title: "Send Money", desc: `Send payment to ${config.bkashNumber}` },
    { step: 3, icon: Copy, title: "Copy TxnID", desc: "Copy the transaction ID from bKash" },
    { step: 4, icon: CheckCircle2, title: "Submit Below", desc: "Fill in the form and submit" },
  ], [config.bkashNumber]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!session) return;
    void loadMyRequests();
  }, [loadMyRequests, session]);

  useEffect(() => {
    if (!session) return;

    let mounted = true;
    void getOrCreateUserProfile()
      .then((profile) => {
        if (!mounted) return;
        setProfileTier(profile.subscriptionTier);
        setProfileEndDate(profile.subscriptionEndDate);
      })
      .catch(() => {
        if (!mounted) return;
        setProfileTier("free");
        setProfileEndDate(null);
      });

    return () => {
      mounted = false;
    };
  }, [session]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(() => clearSubscriptionError(), 4500);
    return () => window.clearTimeout(timer);
  }, [clearSubscriptionError, errorMessage]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: { months: 1, amount: config?.proPrice || 199, senderNumber: "", transactionId: "" },
  });

  useEffect(() => {
    if (selectedMonths === 1) setValue("amount", config.proPrice);
    else if (selectedMonths === 3) setValue("amount", config.threeMonthPrice);
    else if (selectedMonths >= 12) setValue("amount", config.annualPrice);
    else setValue("amount", selectedMonths * config.proPrice);
  }, [config.proPrice, config.threeMonthPrice, config.annualPrice, selectedMonths, setValue]);

  const myRequests = useMemo(() => {
    if (!session) return [];
    return requests.filter((item) => item.userId === session.user_id);
  }, [requests, session]);

  const activeSubscription = useMemo(() => {
    if (profileTier !== "pro") return null;

    const end = profileEndDate ? new Date(profileEndDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (end && end < today) {
      return null;
    }

    const diffMs = end ? Math.max(0, end.getTime() - now) : null;
    const daysLeft = diffMs === null ? null : Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hoursLeft = diffMs === null ? null : Math.floor((diffMs / (1000 * 60 * 60)) % 24);

    return {
      end: end ? end.toLocaleDateString("en-GB") : "No expiry",
      daysLeft,
      hoursLeft,
    };
  }, [now, profileEndDate, profileTier]);

  const hasPendingRequest = myRequests.some((r) => r.status === "pending");
  const isHighestTier = Boolean(activeSubscription);

  function handlePlanSelect(months: number) {
    setSelectedMonths(months);
    let amount = months * config.proPrice;
    if (months === 3) amount = config.threeMonthPrice;
    else if (months >= 12) amount = config.annualPrice;
    
    setValue("months", months);
    setValue("amount", amount);
    setShowForm(true);
    setTimeout(() => document.getElementById("bkash-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  async function copyBkashNumber() {
    await navigator.clipboard.writeText(config.bkashNumber);
    setCopiedBkash(true);
    setTimeout(() => setCopiedBkash(false), 2000);
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!session) return;
    await submitRequest(
      {
        amount: Number(values.amount),
        months: Number(values.months),
        senderNumber: values.senderNumber.trim(),
        transactionId: values.transactionId.trim(),
      },
      { userId: session.user_id, userName: session.name, userEmail: session.email }
    );
    let amount = selectedMonths * config.proPrice;
    if (selectedMonths === 3) amount = config.threeMonthPrice;
    else if (selectedMonths >= 12) amount = config.annualPrice;

    reset({ months: selectedMonths, amount: amount, senderNumber: "", transactionId: "" });
    setShowForm(false);
  });

  if (!session) {
    return (
      <section className="rounded-[2rem] border border-border/80 bg-surface p-6 shadow-[var(--soft-shadow)]">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Crown size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Upgrade to Pro</h2>
          <p className="text-sm text-muted-foreground">Sign in to manage your HabitWallet Pro subscription.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 pb-10">
      {/* Hero Banner */}
      <article className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-accent/80 p-6 text-white shadow-[var(--card-shadow)]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%), radial-gradient(circle at 20% 80%, white 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-amber-300" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">HabitWallet Professional</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold leading-tight">
            {activeSubscription ? "Your Pro Plan" : "Unlock Full Power"}
          </h2>
          <p className="mt-1 text-sm text-white/75">
            {activeSubscription
              ? `Active until ${activeSubscription.end}${
                  activeSubscription.daysLeft !== null
                    ? ` · ${activeSubscription.daysLeft}d ${activeSubscription.hoursLeft ?? 0}h left`
                    : ""
                }`
              : "Cloud sync, advanced analytics, PDF exports & more"}
          </p>
          {activeSubscription && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <BadgeCheck size={13} className="text-emerald-300" />
              Professional Active
            </div>
          )}
          {hasPendingRequest && !activeSubscription && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400/25 px-3 py-1 text-xs font-semibold">
              <Clock3 size={13} />
              Payment under review
            </div>
          )}
        </div>
      </article>

      {/* Plan Comparison */}
      <article>
        <h3 className="mb-3 px-1 text-sm font-semibold text-foreground">
          {isHighestTier ? "Your current tier" : "Choose your plan"}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PlanCard
            name={SUBSCRIPTION_PLANS.free.name}
            price="0"
            period="forever"
            features={SUBSCRIPTION_PLANS.free.features}
            isActive={!activeSubscription}
          />
          <PlanCard
            name={SUBSCRIPTION_PLANS.pro.name}
            price={String(config.proPrice)}
            period="month"
            features={SUBSCRIPTION_PLANS.pro.features}
            isActive={Boolean(activeSubscription)}
            isPro
            tag={isHighestTier ? "Current Highest Tier" : "Most Popular"}
            ctaLabel={isHighestTier ? "Extend with annual offer" : "Upgrade to Professional"}
            onSelect={() => handlePlanSelect(isHighestTier ? 12 : 1)}
          />
        </div>
      </article>

      {isHighestTier ? (
        <article className="rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-200">
          <p className="text-sm font-semibold">You are already on the highest plan tier.</p>
          <p className="mt-1 text-xs">
            Want better value? Extend your Pro plan with 3-month or annual pricing below.
          </p>
        </article>
      ) : null}

      {/* Duration Picker */}
      {
        <article className="rounded-[2rem] border border-border/80 bg-surface p-5 shadow-[var(--soft-shadow)]">
          <h3 className="text-sm font-semibold text-foreground">
            {isHighestTier ? "Extend your Pro plan" : "Select duration"}
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { months: 1, label: "Starter", subLabel: "1 Month", price: config.proPrice },
              {
                months: 3,
                label: "Growth",
                subLabel: "3 Months",
                price: config.threeMonthPrice,
                saving: `Save ${Math.round((1 - config.threeMonthPrice / (config.proPrice * 3)) * 100)}%`,
              },
              {
                months: 12,
                label: "Elite",
                subLabel: "1 Year",
                price: config.annualPrice,
                saving: `Save ${Math.round((1 - config.annualPrice / (config.proPrice * 12)) * 100)}%`,
              },
            ].map((opt) => (
              <button
                key={opt.months}
                type="button"
                onClick={() => handlePlanSelect(opt.months)}
                className={`flex flex-col items-center rounded-xl border p-3 text-center transition-all ${
                  selectedMonths === opt.months && showForm
                    ? "border-primary bg-primary/8 ring-1 ring-primary"
                    : "border-border/60 bg-background hover:border-primary/50"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/85">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.subLabel}</span>
                <span className="mt-1 text-sm font-bold text-foreground">৳{opt.price}</span>
                {opt.saving && <span className="mt-0.5 text-[10px] text-primary">{opt.saving}</span>}
              </button>
            ))}
          </div>
        </article>
      }

      {/* bKash Payment Flow */}
      {showForm && (
        <article id="bkash-form" className="rounded-[2rem] border border-border/80 bg-surface p-5 shadow-[var(--soft-shadow)] animate-soft-rise">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e2136e]/10">
              <span className="text-sm font-bold text-[#e2136e]">b</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">bKash Payment</p>
              <p className="text-xs text-muted-foreground">
                {isHighestTier ? "Manual send-money extension" : "Manual send-money activation"}
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BKASH_STEPS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex flex-col gap-1 rounded-xl bg-background p-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Icon size={14} className="text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground">{title}</p>
                <p className="text-[10px] leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* bKash Number Display */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-[#e2136e]/25 bg-[#e2136e]/5 px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Send payment to</p>
              <p className="mt-0.5 font-mono text-base font-bold text-foreground">{config.bkashNumber}</p>
            </div>
            <button
              type="button"
              onClick={copyBkashNumber}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background"
            >
              <Copy size={12} />
              {copiedBkash ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Info Banner */}
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-accent/10 px-3 py-2.5">
            <Info size={13} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-xs text-muted-foreground">
              Send{" "}
              <strong className="text-foreground">
                ৳{selectedMonths === 3 ? config.threeMonthPrice : (selectedMonths >= 12 ? config.annualPrice : selectedMonths * config.proPrice)}
              </strong>{" "}
              via bKash Send Money (not payment). Use personal bKash account. Activation occurs within{" "}
              <strong className="text-foreground">24 hours</strong> of admin review.
            </p>
          </div>

          {/* Submission Form */}
          <form className="space-y-3" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Duration (months)</span>
                <input
                  type="number"
                  readOnly
                  className="min-h-11 w-full rounded-xl border border-border bg-background/60 px-3 text-sm text-muted-foreground"
                  {...register("months")}
                />
                {errors.months && <span className="mt-1 block text-xs text-red-600">{errors.months.message}</span>}
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Amount (BDT)</span>
                <input
                  type="number"
                  readOnly
                  className="min-h-11 w-full rounded-xl border border-border bg-background/60 px-3 text-sm text-muted-foreground"
                  {...register("amount")}
                />
                {errors.amount && <span className="mt-1 block text-xs text-red-600">{errors.amount.message}</span>}
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Your bKash number (sender)</span>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                {...register("senderNumber")}
              />
              {errors.senderNumber && (
                <span className="mt-1 block text-xs text-red-600">{errors.senderNumber.message}</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">bKash transaction ID</span>
              <input
                type="text"
                placeholder="e.g. A7K2LM91XP"
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-mono uppercase focus:border-primary focus:outline-none"
                {...register("transactionId")}
              />
              {errors.transactionId && (
                <span className="mt-1 block text-xs text-red-600">{errors.transactionId.message}</span>
              )}
            </label>

            {errorMessage && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400">
                {errorMessage}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="min-h-11 flex-1 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="inline-flex min-h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting || isLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {isSubmitting || isLoading ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </form>
        </article>
      )}

      {/* Request History */}
      {myRequests.length > 0 && (
        <article className="rounded-[2rem] border border-border/80 bg-surface p-5 shadow-[var(--soft-shadow)]">
          <h3 className="text-sm font-semibold text-foreground">Payment history</h3>
          <ul className="mt-3 space-y-2.5">
            {myRequests.map((request) => {
              const cfg = statusConfig(request.status);
              const StatusIcon = cfg.icon;
              return (
                <li key={request.id} className={`rounded-xl border px-4 py-3 ${cfg.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon size={14} className={cfg.color} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {request.months} month{request.months !== 1 ? "s" : ""} · ৳{request.amount}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">TXN: {request.transactionId}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock3 size={10} />
                    {new Date(request.submittedAt).toLocaleString("en-GB")}
                  </div>
                  {request.adminNote && (
                    <p className="mt-2 rounded-lg bg-surface/80 px-2 py-1.5 text-[11px] text-muted-foreground">
                      💬 {request.adminNote}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      )}

      {/* Help */}
      <article className="rounded-[2rem] border border-border/80 bg-surface p-5 shadow-[var(--soft-shadow)]">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Need help?</h3>
        <p className="text-xs text-muted-foreground">
          Payments are manually reviewed within 24 hours. If your payment isn&apos;t activated after 24h, contact us
          with your bKash transaction ID.
        </p>
        <a
          href={`mailto:${config.supportEmail}`}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink size={11} />
          {config.supportEmail}
        </a>
      </article>
    </section>
  );
}
