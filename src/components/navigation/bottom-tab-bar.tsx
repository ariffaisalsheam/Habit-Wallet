"use client";

import Link from "next/link";
import { ChartNoAxesCombined, CircleUserRound, HandCoins, ListChecks, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tabs = [
  { href: "/", label: "Habits", icon: ListChecks },
  { href: "/finance", label: "Finance", icon: HandCoins },
  { href: "/add", label: "Add", icon: Plus },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-surface/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur md:left-1/2 md:w-[28rem] md:-translate-x-1/2 md:rounded-t-3xl md:border-x">
      <ul className="mx-auto grid w-full max-w-md grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={clsx(
                  "flex min-h-11 flex-col items-center justify-center rounded-xl px-1 py-1 text-[11px] font-medium transition",
                  isActive
                    ? "bg-primary text-white shadow-[0_10px_30px_-20px_rgba(31,107,74,0.9)]"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 2} />
                <span className="mt-0.5">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
