"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Clock3,
  CreditCard,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useSubscriptionStore } from "@/features/subscription/store/use-subscription-store";
import { getStoredUserSession } from "@/lib/storage/session";
import { listTopProfiles } from "@/lib/profile/service";
import { SUBSCRIPTION_PLANS } from "@/features/subscription/plans";

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color?: "primary" | "amber" | "emerald" | "red" | "purple";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    red: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  };

  return (
    <div className="wellness-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${trend >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"}`}
          >
            <TrendingUp size={10} />
            {trend >= 0 ? "+" : ""}
            {trend}%
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {trendLabel && <p className="mt-1 text-[10px] text-muted-foreground">{trendLabel}</p>}
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  desc,
  badge,
  badgeColor = "amber",
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  badge?: string | number;
  badgeColor?: "amber" | "emerald" | "red";
}) {
  const badgeColorMap = {
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && badge !== 0 && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeColorMap[badgeColor]}`}>{badge}</span>
        )}
        <ArrowRight size={14} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const session = getStoredUserSession();
  const requests = useSubscriptionStore((state) => state.requests);
  const loadAdminRequests = useSubscriptionStore((state) => state.loadAdminRequests);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const [activeProUserIds, setActiveProUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session) {
      router.replace("/auth/login");
      return;
    }
    if (!session.is_admin) {
      router.replace("/profile");
    }
  }, [router, session]);

  useEffect(() => {
    void loadAdminRequests();
  }, [loadAdminRequests]);

  useEffect(() => {
    let mounted = true;

    async function loadProfiles() {
      try {
        const result = await listTopProfiles(500);
        if (!mounted) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeIds = new Set(
          result.documents
            .map((doc) => doc as Record<string, unknown>)
            .filter((d) => {
              const tier = d.subscriptionTier as string | undefined;
              if (tier !== "pro") return false;

              const rawEnd = d.subscriptionEndDate;
              if (typeof rawEnd !== "string" || !rawEnd) return true;

              const end = new Date(rawEnd);
              end.setHours(0, 0, 0, 0);
              return end >= today;
            })
            .map((d) => String(d.userId ?? ""))
            .filter(Boolean)
        );

        setActiveProUserIds(activeIds);
      } catch {
        if (!mounted) return;
        setActiveProUserIds(new Set());
      }
    }

    void loadProfiles();
    return () => {
      mounted = false;
    };
  }, []);

  if (!session?.is_admin) return null;

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = activeProUserIds.size;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const totalRevenue = approvedCount * SUBSCRIPTION_PLANS.pro.monthlyPrice;

  const recentActivity = [...requests]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-5 pb-10">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/8 via-surface to-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Welcome back</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">{session.name || session.email}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock3 size={10} />
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      {/* KPI Stats */}
      <div>
        <h3 className="mb-2.5 px-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Overview
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Pending Reviews" value={pendingCount} icon={Clock3} color="amber" />
          <StatCard label="Active Pro Users" value={approvedCount} icon={BadgeCheck} color="emerald" />
          <StatCard label="Rejected" value={rejectedCount} icon={XCircle} color="red" />
          <StatCard
            label="Total Revenue"
            value={`৳${totalRevenue.toLocaleString()}`}
            icon={TrendingUp}
            color="primary"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-2.5 px-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <QuickActionCard
            href="/admin/subscriptions"
            icon={CreditCard}
            title="Review Subscriptions"
            desc="Approve or reject bKash payments"
            badge={pendingCount}
            badgeColor={pendingCount > 0 ? "amber" : "emerald"}
          />
          <QuickActionCard
            href="/admin/users"
            icon={Users}
            title="User Management"
            desc="View and manage all registered users"
          />
          <QuickActionCard
            href="/admin/analytics"
            icon={BarChart3}
            title="Analytics & Reports"
            desc="Revenue trends and user growth"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="mb-2.5 flex items-center justify-between px-0.5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Activity</h3>
          <Link
            href="/admin/subscriptions"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all <ArrowUpRight size={11} />
          </Link>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface">
          {recentActivity.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {isLoading ? "Loading..." : "No subscription requests yet."}
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {recentActivity.map((req, idx) => (
                <li key={req.id} className={`flex items-center gap-3 px-4 py-3 ${idx === 0 ? "rounded-t-2xl" : ""} ${idx === recentActivity.length - 1 ? "rounded-b-2xl" : ""}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    req.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                    req.status === "rejected" ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  }`}>
                    {req.status === "approved" ? "✓" : req.status === "rejected" ? "✗" : "⏳"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{req.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      ৳{req.amount} · {req.months}mo
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase ${
                      req.status === "approved" ? "text-emerald-600 dark:text-emerald-400" :
                      req.status === "rejected" ? "text-red-600 dark:text-red-400" :
                      "text-amber-600 dark:text-amber-400"
                    }`}>{req.status}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(req.submittedAt).toLocaleDateString("en-GB")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
