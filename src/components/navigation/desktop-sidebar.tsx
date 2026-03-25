"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/navigation/nav-items";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-dvh border-r border-border/70 bg-surface/80 p-3 backdrop-blur md:flex md:flex-col">
      <nav className="mt-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group inline-flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-primary/90 text-white shadow-[0_14px_30px_-20px_rgba(111,155,127,0.8)]"
                  : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
              )}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
