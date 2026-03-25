"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Home,
  LogOut,
  Settings,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: Home, exact: true },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

type AdminNavProps = {
  mobile?: boolean;
};

export function AdminNav({ mobile }: AdminNavProps) {
  const pathname = usePathname();

  function isActive(item: (typeof NAV_ITEMS)[0]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  if (mobile) {
    return (
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-surface p-1.5 scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="sticky top-20 flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-4 border-t border-border/60 pt-4">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-surface hover:text-foreground"
        >
          <LogOut size={16} />
          Exit Admin
        </Link>
      </div>
    </nav>
  );
}
