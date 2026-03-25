"use client";

import { ReactNode, useSyncExternalStore, useEffect, useState } from "react";
import Image from "next/image";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStoredUserSession, USER_SESSION_EVENT } from "@/lib/storage/session";
import { getOrCreateUserProfile, UserProfile } from "@/lib/profile/service";
import Link from "next/link";

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

export function MobileAppShell({ children, title = "Dashboard" }: MobileAppShellProps) {
  const session = useSyncExternalStore(subscribeToSession, getStoredUserSession, () => null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (session) {
      getOrCreateUserProfile().then(setProfile).catch(() => {});
    }
  }, [session]);

  const isPro = profile?.subscriptionTier === "pro";

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
                  width={30}
                  height={30}
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
                {mounted && session && (
                  <Link 
                    href="/profile" 
                    className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border-2 border-surface-elevated bg-surface-elevated shadow-sm transition-transform active:scale-95 ${isPro ? 'animate-avatar-pulse border-amber-400/40' : ''}`}
                  >
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {(profile?.name || session.name)[0]}
                      </span>
                    )}
                  </Link>
                )}
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
