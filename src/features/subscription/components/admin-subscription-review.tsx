"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSubscriptionStore } from "@/features/subscription/store/use-subscription-store";
import { getStoredUserSession } from "@/lib/storage/session";

export function AdminSubscriptionReview() {
  const session = getStoredUserSession();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const requests = useSubscriptionStore((state) => state.requests);
  const reviewRequest = useSubscriptionStore((state) => state.reviewRequest);
  const loadAdminRequests = useSubscriptionStore((state) => state.loadAdminRequests);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const errorMessage = useSubscriptionStore((state) => state.errorMessage);
  const clearSubscriptionError = useSubscriptionStore((state) => state.clearSubscriptionError);

  useEffect(() => {
    void loadAdminRequests();
  }, [loadAdminRequests]);

  useEffect(() => {
    if (!errorMessage) return;

    const timer = window.setTimeout(() => {
      clearSubscriptionError();
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [clearSubscriptionError, errorMessage]);

  const reviewer = session?.name || session?.email || "Local Admin";

  const pending = requests.filter((request) => request.status === "pending");
  const processed = requests.filter((request) => request.status !== "pending").slice(0, 8);

  function updateNote(id: string, value: string) {
    setNotes((prev) => ({ ...prev, [id]: value }));
  }

  async function approve(id: string) {
    await reviewRequest(id, "approved", notes[id] ?? "Approved after transaction verification.", reviewer);
  }

  async function reject(id: string) {
    await reviewRequest(id, "rejected", notes[id] ?? "Rejected. Please verify transaction ID and retry.", reviewer);
  }

  return (
    <section className="space-y-4 pb-8">
      <article className="wellness-card rounded-[2rem] p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Subscription approvals</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Review manual bKash payments and approve or reject requests from users.
        </p>
      </article>

      <article className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
        <h3 className="text-base font-semibold text-foreground">Pending requests</h3>
        {errorMessage ? <p className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-800">{errorMessage}</p> : null}
        <ul className="mt-3 space-y-2">
          {pending.length === 0 ? (
            <li className="rounded-xl bg-background px-3 py-3 text-sm text-muted-foreground">No pending requests.</li>
          ) : (
            pending.map((request) => (
              <li key={request.id} className="rounded-xl border border-border/70 bg-background px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{request.userName}</p>
                    <p className="text-xs text-muted-foreground">{request.userEmail}</p>
                  </div>
                  <p className="text-xs font-semibold uppercase text-amber-600">pending</p>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p>Plan: {request.months} month</p>
                  <p>Amount: BDT {request.amount}</p>
                  <p>Sender: {request.senderNumber}</p>
                  <p>Txn: {request.transactionId}</p>
                </div>

                <textarea
                  className="mt-2 min-h-20 w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs"
                  placeholder="Optional admin note"
                  value={notes[request.id] ?? ""}
                  onChange={(event) => updateNote(request.id, event.target.value)}
                />

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => approve(request.id)}
                    className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-primary px-3 text-xs font-semibold text-white"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => reject(request.id)}
                    className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-700"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </article>

      <article className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
        <h3 className="text-base font-semibold text-foreground">Recent decisions</h3>
        <ul className="mt-3 space-y-2">
          {processed.length === 0 ? (
            <li className="rounded-xl bg-background px-3 py-3 text-sm text-muted-foreground">No processed requests yet.</li>
          ) : (
            processed.map((request) => (
              <li key={request.id} className="rounded-xl border border-border/70 bg-background px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{request.userName}</p>
                  <p className={request.status === "approved" ? "text-xs font-semibold uppercase text-primary" : "text-xs font-semibold uppercase text-red-600"}>
                    {request.status}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Txn: {request.transactionId}</p>
                <p className="mt-1 text-xs text-muted-foreground">Reviewed by: {request.reviewedBy || "-"}</p>
                {request.adminNote ? (
                  <p className="mt-1 text-xs text-muted-foreground">Note: {request.adminNote}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
