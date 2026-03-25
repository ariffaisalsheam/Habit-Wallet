"use client";

import { ReactNode, useSyncExternalStore, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStoredUserSession, USER_SESSION_EVENT } from "@/lib/storage/session";
import { getCachedUserProfile, getOrCreateUserProfile, UserProfile } from "@/lib/profile/service";
import Link from "next/link";
import { Crown, Zap } from "lucide-react";
import { useTransactionsStore } from "@/features/finance/store/use-transactions-store";
import { useBudgetsStore } from "@/features/finance/store/use-budgets-store";
import { useHabitsStore } from "@/features/habits/store/use-habits-store";
import { getLastSyncAt, LAST_SYNC_EVENT } from "@/lib/storage/sync-queue";

type MobileAppShellProps = {
  children: ReactNode;
  title?: string;
};

function subscribeToSession(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(USER_SESSION_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(USER_SESSION_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function subscribeToOnline(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineStatus() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function subscribeToLastSync(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LAST_SYNC_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(LAST_SYNC_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readLastSyncAt() {
  if (typeof window === "undefined") return null;
  return getLastSyncAt();
}

export function MobileAppShell({ children, title = "Dashboard" }: MobileAppShellProps) {
  const session = useSyncExternalStore(subscribeToSession, getStoredUserSession, () => null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const isOnline = useSyncExternalStore(
    subscribeToOnline,
    getOnlineStatus,
    () => true
  );

  const syncingTransactions = useTransactionsStore((state) => state.syncing);
  const syncingBudgets = useBudgetsStore((state) => state.syncing);
  const syncingHabits = useHabitsStore((state) => state.syncing);
  const pendingTransactions = useTransactionsStore((state) => state.pendingQueueCount);
  const pendingBudgets = useBudgetsStore((state) => state.pendingQueueCount);
  const pendingHabits = useHabitsStore((state) => state.pendingQueueCount);

  const cachedProfile = useMemo(() => {
    if (!session) return null;
    return getCachedUserProfile(session.user_id);
  }, [session]);

  const profileForSession = useMemo(() => {
    if (!session) return null;
    if (profile?.userId === session.user_id) return profile;
    return cachedProfile;
  }, [cachedProfile, profile, session]);

  useEffect(() => {
    if (!session) return;

    let mounted = true;
    getOrCreateUserProfile()
      .then((fresh) => {
        if (!mounted) return;
        setProfile(fresh);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [session]);

  const isPro = profileForSession?.subscriptionTier === "pro";
  const pendingTotal = pendingTransactions + pendingBudgets + pendingHabits;
  const syncingAny = syncingTransactions || syncingBudgets || syncingHabits;
  const storedLastSyncedAt = useSyncExternalStore(subscribeToLastSync, readLastSyncAt, () => null);
  const lastSyncedAt = syncingAny ? null : storedLastSyncedAt;

  const syncStatusText = !isOnline
    ? "Offline mode active"
    : !isPro
      ? "Cloud sync locked (Professional feature)"
      : syncingAny
        ? "Syncing..."
        : pendingTotal > 0
          ? `${pendingTotal} change${pendingTotal === 1 ? "" : "s"} pending sync`
          : lastSyncedAt
            ? `Synced at ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Synced";

  return (
    <div className="wellness-shell min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-[72rem] gap-4 px-3 pb-1 pt-3 md:px-5 md:pt-6">
        <DesktopSidebar />
        <BottomTabBar />

        <div className="flex w-full min-w-0 flex-col md:pb-4">
          <header className="sticky top-0 z-20 rounded-3xl border border-border/70 bg-surface/85 px-4 pb-3 pt-3 backdrop-blur md:px-5 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <Image
                  src="/logo/android-chrome-512x512.png"
                  alt="HabitWallet logo"
                  width={38}
                  height={38}
                  className="rounded-lg"
                  priority
                />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    HabitWallet
                  </p>
                  <h1 className="font-mono text-lg font-semibold leading-none text-foreground md:text-xl">
                    {title}
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ThemeToggle />
                {session && (
                  <Link 
                    href="/profile" 
                    className={`relative flex h-9 w-9 items-center justify-center rounded-xl border-2 border-surface-elevated bg-surface-elevated shadow-sm transition-transform active:scale-95 ${isPro ? 'animate-avatar-pulse border-amber-400/40' : ''}`}
                  >
                    <span className="h-full w-full overflow-hidden rounded-[0.65rem]">
                      {profileForSession?.avatar ? (
                        <img src={profileForSession.avatar} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
                          {(profileForSession?.name || session.name)[0]}
                        </span>
                      )}
                    </span>
                    <span className={`avatar-tier-dot ${isPro ? "" : "avatar-tier-dot-free"}`}>
                      {isPro ? <Crown size={10} /> : <Zap size={9} />}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            <div
              className={`mt-2.5 rounded-xl border border-border/60 bg-background/70 px-2.5 py-1.5 text-[10px] font-semibold ${
                !isOnline
                  ? "text-amber-700 dark:text-amber-400"
                  : !isPro
                    ? "text-muted-foreground"
                    : syncingAny
                      ? "animate-pulse text-primary"
                      : "text-emerald-700 dark:text-emerald-400"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{syncStatusText}</span>
                {isOnline && !isPro && session ? (
                  <Link
                    href="/subscription"
                    className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/25"
                  >
                    Upgrade
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 px-1 pb-24 pt-4 md:px-1 md:pb-2 md:pt-5">{children}</main>
          <div className="h-2 md:hidden" />
        </div>
      </div>
    </div>
  );
}
