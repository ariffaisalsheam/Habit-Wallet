"use client";

import { useEffect } from "react";
import { Clock3, ListChecks, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminSubscriptionReview } from "@/features/subscription/components/admin-subscription-review";
import { useSubscriptionStore } from "@/features/subscription/store/use-subscription-store";
import { getStoredUserSession } from "@/lib/storage/session";

export default function AdminPage() {
  const router = useRouter();
  const session = getStoredUserSession();
  const requests = useSubscriptionStore((state) => state.requests);
  const isLoading = useSubscriptionStore((state) => state.isLoading);

  useEffect(() => {
    if (!session) {
      router.replace("/auth/login");
      return;
    }

    if (!session.is_admin) {
      router.replace("/profile");
    }
  }, [router, session]);

  const pendingCount = requests.filter((request) => request.status === "pending").length;
  const approvedCount = requests.filter((request) => request.status === "approved").length;
  const reviewedCount = requests.filter((request) => request.status !== "pending").length;

  if (!session?.is_admin) {
    return null;
  }

  return (
    <section className="space-y-4">
      <article className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
          <p className="text-xs text-muted-foreground">Pending approvals</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xl font-semibold text-foreground">
            <Clock3 size={16} /> {pendingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xl font-semibold text-foreground">
            <ShieldCheck size={16} /> {approvedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
          <p className="text-xs text-muted-foreground">Total reviewed</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xl font-semibold text-foreground">
            <ListChecks size={16} /> {reviewedCount}
          </p>
        </div>
      </article>

      <AdminSubscriptionReview />
      {isLoading ? <p className="text-xs text-muted-foreground">Syncing admin requests...</p> : null}
    </section>
  );
}
