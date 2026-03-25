import type { ReactNode } from "react";
import Image from "next/image";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="wellness-shell min-h-dvh bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/android-chrome-512x512.png"
              alt="HabitWallet logo"
              width={30}
              height={30}
              className="rounded-lg"
              priority
            />
            <div className="leading-none">
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">HabitWallet</p>
              <h1 className="font-mono text-sm font-bold text-foreground md:text-base">Admin Console</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-700/50 dark:bg-amber-950/50 dark:text-amber-400 sm:block">
              Admin Only
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem] gap-0 md:gap-5 md:px-5 md:py-6">
        {/* Sidebar Nav (desktop) */}
        <aside className="hidden w-52 shrink-0 md:block">
          <AdminNav />
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-3 py-4 md:px-0 md:py-0">
          {/* Mobile Nav */}
          <div className="mb-4 md:hidden">
            <AdminNav mobile />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
