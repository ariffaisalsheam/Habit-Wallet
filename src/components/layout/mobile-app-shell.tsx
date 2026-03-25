import { ReactNode } from "react";
import Image from "next/image";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

type MobileAppShellProps = {
  children: ReactNode;
  title?: string;
};

export function MobileAppShell({ children, title = "Dashboard" }: MobileAppShellProps) {
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
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 px-1 pb-24 pt-4 md:px-1 md:pb-2 md:pt-5">{children}</main>
          <div className="h-2 md:hidden" />
        </div>
      </div>
    </div>
  );
}
