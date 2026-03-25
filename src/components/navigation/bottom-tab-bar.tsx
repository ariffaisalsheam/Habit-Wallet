"use client";

import Link from "next/link";
import { ChartNoAxesCombined, CircleUserRound, HandCoins, ListChecks } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tabs = [
  { href: "/", label: "Habits", icon: ListChecks },
  { href: "/finance", label: "Finance", icon: HandCoins },
  { href: "/analytics", label: "Insights", icon: ChartNoAxesCombined },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-surface/92 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid w-full max-w-md grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={clsx(
                    "group flex min-h-12 flex-col items-center justify-center rounded-full px-1 text-[11px] font-semibold tracking-[0.01em] transition-all duration-300",
                    isActive
                      ? "soft-glow-active bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                  )}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.25 : 2}
                    className={clsx("transition-transform duration-300", isActive ? "scale-105" : "scale-100")}
                  />
                  <span className="mt-0.5">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="Primary"
        className="sticky top-6 hidden h-[calc(100dvh-3rem)] rounded-[2rem] border border-border/70 bg-surface/85 p-3 shadow-[var(--soft-shadow)] backdrop-blur md:flex md:w-[5.5rem] lg:w-[15.25rem]"
      >
        <ul className="flex w-full flex-col gap-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={clsx(
                    "group flex min-h-12 items-center justify-center gap-3 rounded-2xl px-3 text-sm font-medium transition-all duration-300 lg:justify-start",
                    isActive
                      ? "soft-glow-active bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                  )}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.25 : 2}
                    className={clsx("transition-transform duration-300", isActive ? "scale-105" : "scale-100")}
                  />
                  <span className="hidden lg:inline">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
