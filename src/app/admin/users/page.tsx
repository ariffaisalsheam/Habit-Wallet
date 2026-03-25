"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  User,
  Users,
} from "lucide-react";
import { listTopProfiles } from "@/lib/profile/service";
import { useSubscriptionStore } from "@/features/subscription/store/use-subscription-store";
import type { UserProfile } from "@/lib/profile/service";
import { SubscriptionBadge } from "@/features/subscription/components/subscription-badge";
import { cancelUserPlanByAdmin } from "@/lib/subscription/service";

function UserCard({
  profile,
  subscriptionCount,
  onCancelPlan,
  cancelling,
}: {
  profile: UserProfile;
  subscriptionCount: number;
  onCancelPlan: (profile: UserProfile) => void;
  cancelling: boolean;
}) {
  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile.email.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface px-4 py-3 transition-all hover:border-primary/30">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">{profile.name || "—"}</p>
          <SubscriptionBadge tier={profile.subscriptionTier} />
        </div>
        <p className="text-xs text-muted-foreground">{profile.email}</p>
        {profile.phone && <p className="text-xs text-muted-foreground">{profile.phone}</p>}
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">{subscriptionCount} sub{subscriptionCount !== 1 ? "s" : ""}</p>
        {profile.subscriptionEndDate && (
          <p className="text-[10px] text-primary">until {new Date(profile.subscriptionEndDate).toLocaleDateString("en-GB")}</p>
        )}
        {profile.subscriptionTier === "pro" && (
          <button
            type="button"
            onClick={() => onCancelPlan(profile)}
            disabled={cancelling}
            className="mt-1 inline-flex min-h-7 items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-400"
          >
            {cancelling ? <Loader2 size={10} className="animate-spin" /> : <Ban size={10} />}
            Cancel plan
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "free" | "pro">("all");
  const [cancellingUserId, setCancellingUserId] = useState<string | null>(null);
  const requests = useSubscriptionStore((state) => state.requests);
  const loadAdminRequests = useSubscriptionStore((state) => state.loadAdminRequests);

  async function fetchProfiles() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listTopProfiles(100);
      setProfiles(
        result.documents.map((doc) => {
          const d = doc as Record<string, unknown>;
          return {
            userId: String(d.userId ?? ""),
            email: String(d.email ?? ""),
            name: String(d.name ?? ""),
            phone: String(d.phone ?? ""),
            avatar: String(d.avatar ?? ""),
            country: String(d.country ?? "Bangladesh"),
            language: String(d.language ?? "en"),
            subscriptionTier: (d.subscriptionTier as "free" | "pro") ?? "free",
            subscriptionEndDate: typeof d.subscriptionEndDate === "string" ? d.subscriptionEndDate : null,
            updatedAt: String(d.updatedAt ?? ""),
          };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchProfiles();
    void loadAdminRequests();
  }, [loadAdminRequests]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleCancelPlan(profile: UserProfile) {
    setCancellingUserId(profile.userId);
    setError(null);

    try {
      await cancelUserPlanByAdmin(profile.userId, `Plan cancelled by admin for ${profile.email}.`);
      setProfiles((current) =>
        current.map((item) =>
          item.userId === profile.userId
            ? {
                ...item,
                subscriptionTier: "free",
                subscriptionEndDate: null,
              }
            : item
        )
      );
      setMessage(`Cancelled Professional plan for ${profile.name || profile.email}.`);
      void fetchProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel this plan.");
    } finally {
      setCancellingUserId(null);
    }
  }

  const filtered = profiles.filter((p) => {
    const matchesTier = tierFilter === "all" || p.subscriptionTier === tierFilter;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const proCount = profiles.filter((p) => p.subscriptionTier === "pro").length;
  const freeCount = profiles.filter((p) => p.subscriptionTier === "free").length;

  function subscriptionCountForUser(userId: string) {
    return requests.filter((r) => r.userId === userId && r.status === "approved").length;
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">User Management</h2>
        <p className="mt-1 text-xs text-muted-foreground">View all registered user profiles and subscription tiers.</p>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-background p-3 text-center">
            <p className="flex items-center justify-center gap-1 text-xl font-bold text-foreground">
              <Users size={16} />
              {profiles.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Users</p>
          </div>
          <div className="rounded-xl bg-background p-3 text-center">
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{proCount}</p>
            <p className="text-[10px] text-muted-foreground">Pro Users</p>
          </div>
          <div className="rounded-xl bg-background p-3 text-center">
            <p className="text-xl font-bold text-muted-foreground">{freeCount}</p>
            <p className="text-[10px] text-muted-foreground">Free Users</p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "pro", "free"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTierFilter(f)}
              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all ${
                tierFilter === f
                  ? "bg-primary text-white"
                  : "border border-border/60 text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              {f === "all" ? "All tiers" : `${f.charAt(0).toUpperCase() + f.slice(1)} only`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void fetchProfiles()}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1 text-xs text-muted-foreground hover:bg-surface"
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
          <br />
          <button className="mt-1 font-semibold underline" onClick={() => void fetchProfiles()}>Retry</button>
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400">
          {message}
        </div>
      )}

      {/* User List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/60 py-12 text-center">
            <User size={30} className="mx-auto text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              {search || tierFilter !== "all" ? "No users match your search." : "No users found."}
            </p>
          </div>
        ) : (
          filtered.map((profile) => (
            <UserCard
              key={profile.userId}
              profile={profile}
              subscriptionCount={subscriptionCountForUser(profile.userId)}
              onCancelPlan={handleCancelPlan}
              cancelling={cancellingUserId === profile.userId}
            />
          ))
        )}
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-border/60 bg-surface p-4">
        <div className="flex items-start gap-2">
          <Shield size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            User data is fetched from Appwrite users collection. Subscription tier changes happen automatically when
            you approve or reject payment requests in the{" "}
            <a href="/admin/subscriptions" className="font-medium text-primary hover:underline">
              Subscriptions
            </a>{" "}
            section.
          </p>
        </div>
      </div>
    </div>
  );
}
