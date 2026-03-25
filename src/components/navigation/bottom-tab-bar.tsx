"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { navItems } from "@/components/navigation/nav-items";
import { getStoredAppLanguage, subscribeToAppLanguage } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/translations";
import { useSyncExternalStore } from "react";

export function BottomTabBar() {
  const pathname = usePathname();
  const language = useSyncExternalStore(subscribeToAppLanguage, getStoredAppLanguage, () => "en");

  return (
    <nav
      aria-label={t(language, "shell.primary")}
      className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 md:hidden"
    >
      <ul
        className="mx-auto grid w-full max-w-lg grid-cols-5 items-end gap-1 rounded-[1.6rem] border border-border/70 bg-surface/92 px-2 py-2 shadow-[var(--card-shadow)] backdrop-blur"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isAdd = item.href === "/add";

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "group flex min-h-12 flex-col items-center justify-center transition-all duration-300",
                  isAdd
                    ? clsx(
                        "relative -mt-7 min-h-14 rounded-full",
                        isActive ? "text-white" : "text-white/95"
                      )
                    : clsx(
                        "rounded-full px-1 text-[11px] font-semibold tracking-[0.01em]",
                        isActive
                          ? "soft-glow-active bg-primary/20 text-foreground"
                          : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                      )
                )}
              >
                <Icon
                  size={isAdd ? 20 : 18}
                  strokeWidth={isAdd ? 2.4 : isActive ? 2.25 : 2}
                  className={clsx(
                    "transition-transform duration-300",
                    isAdd ? "drop-shadow-sm" : isActive ? "scale-105" : "scale-100"
                  )}
                />
                {isAdd ? (
                  <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary to-accent shadow-[0_14px_24px_-12px_rgba(34,90,64,0.8)]" />
                ) : null}
                <span className={clsx("mt-0.5", isAdd ? "text-[10px] font-bold tracking-wide" : "")}>{t(language, item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
