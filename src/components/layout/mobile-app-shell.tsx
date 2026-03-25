import { ReactNode } from "react";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";
import { ThemeToggle } from "@/components/theme-toggle";

type MobileAppShellProps = {
  children: ReactNode;
};

export function MobileAppShell({ children }: MobileAppShellProps) {
  return (
    <div className="app-noise min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/80 px-4 pb-3 pt-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Habit & Finance
              </p>
              <h1 className="font-mono text-lg font-semibold leading-none text-foreground">
                Dashboard
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

        <BottomTabBar />
      </div>
    </div>
  );
}
