"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { navItems } from "@/components/navigation/nav-items";

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-surface/92 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur md:hidden"
    >
      <ul
        className="mx-auto grid w-full max-w-lg gap-2"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
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
                <span className="mt-0.5">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
