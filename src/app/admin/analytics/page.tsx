"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, TrendingUp, Users, Wallet } from "lucide-react";
import { useSubscriptionStore } from "@/features/subscription/store/use-subscription-store";
import { listTopProfiles } from "@/lib/profile/service";
import { SUBSCRIPTION_PLANS } from "@/features/subscription/plans";

const MONTHS_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MiniBarChart({ data, color = "#6f9b7f" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-16 items-end gap-1">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm"
            style={{
              height: `${Math.max((v / max) * 100, 4)}%`,
              backgroundColor: color,
              opacity: v === 0 ? 0.2 : 1,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const requests = useSubscriptionStore((state) => state.requests);
  const loadAdminRequests = useSubscriptionStore((state) => state.loadAdminRequests);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const [activeProUserIds, setActiveProUserIds] = useState<Set<string>>(new Set());

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

  const stats = useMemo(() => {
    const approved = requests.filter(
      (r) => r.status === "approved" && activeProUserIds.has(r.userId)
    );
    const rejected = requests.filter((r) => r.status === "rejected");
    const pending = requests.filter((r) => r.status === "pending");
    const totalRevenue = activeProUserIds.size * SUBSCRIPTION_PLANS.pro.monthlyPrice;
    const avgRevenue = approved.length ? totalRevenue / approved.length : 0;
    const approvalRate = requests.length
      ? Math.round((approved.length / requests.length) * 100)
      : 0;

    // Monthly revenue for the last 12 months
    const now = new Date();
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return approved
        .filter((r) => r.submittedAt.startsWith(monthStr))
        .reduce((sum, r) => sum + r.amount, 0);
    });

    const monthlySubmissions = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return requests.filter((r) => r.submittedAt.startsWith(monthStr)).length;
    });

    // Most active month
    const peakRevIdx = monthlyRevenue.indexOf(Math.max(...monthlyRevenue));
    const peakMonth = MONTHS_LABELS[(now.getMonth() - 11 + peakRevIdx + 12) % 12];

    // Plan duration breakdown
    const durationBreakdown: Record<number, number> = {};
    approved.forEach((r) => {
      durationBreakdown[r.months] = (durationBreakdown[r.months] ?? 0) + 1;
    });

    return {
      totalRevenue,
      avgRevenue,
      approvedCount: activeProUserIds.size,
      rejectedCount: rejected.length,
      pendingCount: pending.length,
      totalRequests: requests.length,
      approvalRate,
      monthlyRevenue,
      monthlySubmissions,
      peakMonth,
      durationBreakdown,
    };
  }, [activeProUserIds, requests]);

  const last12Labels = Array.from({ length: 12 }, (_, i) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return MONTHS_LABELS[d.getMonth()];
  });

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">Analytics & Reports</h2>
        <p className="mt-1 text-xs text-muted-foreground">Revenue trends, conversion rates, and subscription insights.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Revenue", value: `৳${stats.totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-primary bg-primary/10" },
          { label: "Active Pro Users", value: stats.approvedCount, icon: BadgeCheck, color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400" },
          { label: "Approval Rate", value: `${stats.approvalRate}%`, icon: TrendingUp, color: "text-sky-700 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400" },
          { label: "Total Requests", value: stats.totalRequests, icon: Users, color: "text-muted-foreground bg-border/40" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border/60 bg-surface p-4">
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl ${kpi.color}`}>
              <kpi.icon size={16} />
            </div>
            <p className="text-xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-border/60 bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Monthly Revenue</h3>
            <p className="text-[10px] text-muted-foreground">Last 12 months (BDT)</p>
          </div>
          {stats.peakMonth && <p className="text-xs text-muted-foreground">Peak: {stats.peakMonth}</p>}
        </div>
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-border/30" />
        ) : (
          <MiniBarChart data={stats.monthlyRevenue} color="var(--primary)" />
        )}
        <div className="mt-1 flex justify-between">
          {last12Labels.map((label, i) => (
            <span key={i} className="text-[9px] text-muted-foreground">{label}</span>
          ))}
        </div>
      </div>

      {/* Submissions Chart */}
      <div className="rounded-2xl border border-border/60 bg-surface p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">Monthly Submissions</h3>
          <p className="text-[10px] text-muted-foreground">All subscription requests (last 12 months)</p>
        </div>
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-border/30" />
        ) : (
          <MiniBarChart data={stats.monthlySubmissions} color="#8a83ab" />
        )}
        <div className="mt-1 flex justify-between">
          {last12Labels.map((label, i) => (
            <span key={i} className="text-[9px] text-muted-foreground">{label}</span>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="rounded-2xl border border-border/60 bg-surface p-5">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Key Metrics</h3>
        <div className="divide-y divide-border/40">
          <StatRow label="Average revenue per user (ARPU)" value={`৳${stats.avgRevenue.toFixed(0)}`} />
          <StatRow
            label="Approval rate"
            value={`${stats.approvalRate}%`}
            sub={`${stats.approvedCount} approved / ${stats.totalRequests} total`}
          />
          <StatRow label="Pending review" value={stats.pendingCount} sub="Awaiting admin action" />
          <StatRow label="Rejected requests" value={stats.rejectedCount} sub="Payment not verified" />
        </div>
      </div>

      {/* Plan Duration Breakdown */}
      {Object.keys(stats.durationBreakdown).length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Plan Duration Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(stats.durationBreakdown)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([months, count]) => {
                const pct = Math.round((count / stats.approvedCount) * 100);
                return (
                  <div key={months}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {months} month{Number(months) !== 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold text-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-border/40">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
