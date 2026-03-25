"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutUser } from "@/lib/auth/service";
import { getStoredUserSession, type LocalUserSession } from "@/lib/storage/session";

export function ProfileAuthCard() {
  const router = useRouter();
  const [session, setSession] = useState<LocalUserSession | null>(() => getStoredUserSession());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLogout() {
    setBusy(true);
    setMessage(null);

    const result = await logoutUser();

    if (!result.ok) {
      setMessage(result.message ?? "Logout failed.");
      setBusy(false);
      return;
    }

    setSession(null);
    setBusy(false);
    setMessage("Signed out successfully.");
    router.refresh();
  }

  const isAuthenticated = Boolean(session);

  return (
    <section className="rounded-3xl border border-border bg-surface p-4 shadow-[0_12px_40px_-30px_rgba(0,0,0,0.5)]">
      <h2 className="text-xl font-bold tracking-tight text-foreground">Profile & Session</h2>

      {isAuthenticated ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">Logged in as</p>
          <p className="text-base font-semibold text-foreground">{session?.name || "Unnamed User"}</p>
          <p className="text-sm text-muted-foreground">{session?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {busy ? "Signing out..." : "Sign out"}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">No active session yet. Sign in to enable cloud sync features.</p>
          <div className="flex gap-2">
            <Link
              href="/auth/login"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground"
            >
              Create account
            </Link>
          </div>
        </div>
      )}

      {message ? <p className="mt-3 rounded-xl bg-green-100 px-3 py-2 text-sm text-green-800">{message}</p> : null}
    </section>
  );
}
