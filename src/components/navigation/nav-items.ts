import { ChartNoAxesCombined, CirclePlus, CircleUserRound, HandCoins, ListChecks } from "lucide-react";

export const navItems = [
  { href: "/", labelKey: "nav.habits", icon: ListChecks },
  { href: "/finance", labelKey: "nav.finance", icon: HandCoins },
  { href: "/add", labelKey: "nav.add", icon: CirclePlus },
  { href: "/analytics", labelKey: "nav.analytics", icon: ChartNoAxesCombined },
  { href: "/profile", labelKey: "nav.profile", icon: CircleUserRound },
] as const;
