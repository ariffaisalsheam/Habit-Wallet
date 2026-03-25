"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { useSubscriptionStore } from "@/features/subscription/store/use-subscription-store";
import { getStoredUserSession } from "@/lib/storage/session";
import type { SubscriptionRequest } from "@/features/subscription/types";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

function statusBadge(status: "pending" | "approved" | "rejected") {
  if (status === "approved")
    return "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
  if (status === "rejected")
    return "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:bg-red-950/40 dark:text-red-400";
  return "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
}

function RequestCard({
  request,
  isPending,
  onApprove,
  onReject,
  isLoading,
}: {
  request: SubscriptionRequest;
  isPending: boolean;
  onApprove?: (id: string, note: string) => void;
  onReject?: (id: string, note: string) => void;
  isLoading: boolean;
}) {
  const [note, setNote] = useState(request.adminNote ?? "");
  const [expanded, setExpanded] = useState(isPending);

  const initials = request.userName
    ? request.userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div className={`rounded-2xl border bg-surface transition-all ${
      isPending ? "border-amber-300/60 dark:border-amber-700/40" : "border-border/60"
    }`}>
      {/* Card Header */}
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
          {initials}
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{request.userName}</p>
            <span className={statusBadge(request.status)}>
              {request.status === "approved" && <BadgeCheck size={10} />}
              {request.status === "rejected" && <XCircle size={10} />}
              {request.status === "pending" && <Clock3 size={10} />}
              {request.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{request.userEmail}</p>
        </div>

        {/* Amount + chevron */}
        <div className="flex items-center gap-2 text-right">
          <div>
            <p className="text-sm font-bold text-foreground">৳{request.amount}</p>
            <p className="text-[10px] text-muted-foreground">{request.months}mo</p>
          </div>
          <ChevronDown
            size={15}
            className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border/40 px-4 pb-4 pt-3">
          {/* Details Grid */}
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">bKash Sender</p>
              <p className="mt-0.5 font-mono font-medium text-foreground">{request.senderNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Transaction ID</p>
              <p className="mt-0.5 font-mono font-medium text-foreground">{request.transactionId}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Submitted</p>
              <p className="mt-0.5 font-medium text-foreground">
                {new Date(request.submittedAt).toLocaleString("en-GB")}
              </p>
            </div>
            {request.reviewedAt && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Reviewed</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {new Date(request.reviewedAt).toLocaleString("en-GB")}
                </p>
              </div>
            )}
            {request.reviewedBy && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Reviewed by</p>
                <p className="mt-0.5 font-medium text-foreground">{request.reviewedBy}</p>
              </div>
            )}
          </div>

          {/* Admin Note */}
          {isPending ? (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Admin note (optional)
                </span>
                <textarea
                  className="min-h-16 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  placeholder="Add a note for the user..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onReject?.(request.id, note || "Rejected. Please verify your transaction ID and try again.")}
                  className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onApprove?.(request.id, note || "Approved after transaction verification.")}
                  className="inline-flex min-h-9 flex-[2] items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  Approve & Activate
                </button>
              </div>
            </div>
          ) : (
            request.adminNote && (
              <div className="mt-1 rounded-xl bg-background px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin note</p>
                <p className="mt-1 text-xs text-foreground">{request.adminNote}</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function AdminSubscriptionReview() {
  const session = getStoredUserSession();
  const requests = useSubscriptionStore((state) => state.requests);
  const reviewRequest = useSubscriptionStore((state) => state.reviewRequest);
  const loadAdminRequests = useSubscriptionStore((state) => state.loadAdminRequests);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const errorMessage = useSubscriptionStore((state) => state.errorMessage);
  const clearSubscriptionError = useSubscriptionStore((state) => state.clearSubscriptionError);

  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [search, setSearch] = useState("");

  useEffect(() => {
    void loadAdminRequests();
  }, [loadAdminRequests]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(() => clearSubscriptionError(), 4500);
    return () => window.clearTimeout(timer);
  }, [clearSubscriptionError, errorMessage]);

  const reviewer = session?.name || session?.email || "Admin";

  async function approve(id: string, note: string) {
    await reviewRequest(id, "approved", note, reviewer);
  }

  async function reject(id: string, note: string) {
    await reviewRequest(id, "rejected", note, reviewer);
  }

  const filtered = requests.filter((req) => {
    const matchesFilter = filter === "all" || req.status === filter;
    const matchesSearch =
      !search ||
      req.userName.toLowerCase().includes(search.toLowerCase()) ||
      req.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      req.transactionId.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
        <h2 className="mt-1 text-xl font-bold text-foreground">Subscription Requests</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Review and manage manual bKash payment requests from users.
        </p>

        {/* Mini Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Pending", count: pendingCount, color: "text-amber-700 dark:text-amber-400" },
            { label: "Approved", count: approvedCount, color: "text-emerald-700 dark:text-emerald-400" },
            { label: "Rejected", count: rejectedCount, color: "text-red-600 dark:text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-background p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by name, email, or TxnID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={12} className="text-muted-foreground" />
          {(["all", "pending", "approved", "rejected"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all ${
                filter === f
                  ? "bg-primary text-white"
                  : "border border-border/60 text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f}
              {f === "pending" && pendingCount > 0 && (
                <span className={`ml-1 rounded-full px-1.5 text-[9px] font-bold ${filter === f ? "bg-white/30 text-white" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400">
          {errorMessage}
        </div>
      )}

      {/* Request List */}
      <div className="space-y-2">
        {isLoading && filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/60 py-12 text-center text-sm text-muted-foreground">
            {search ? "No results match your search." : `No ${filter === "all" ? "" : filter} requests.`}
          </div>
        ) : (
          filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              isPending={req.status === "pending"}
              onApprove={approve}
              onReject={reject}
              isLoading={isLoading}
            />
          ))
        )}
      </div>
    </div>
  );
}
