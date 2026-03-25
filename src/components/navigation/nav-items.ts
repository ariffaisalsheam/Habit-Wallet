import { ChartNoAxesCombined, CirclePlus, CircleUserRound, HandCoins, ListChecks } from "lucide-react";

export const navItems = [
  { href: "/", label: "Habits", icon: ListChecks },
  { href: "/finance", label: "Finance", icon: HandCoins },
  { href: "/add", label: "Add", icon: CirclePlus },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
] as const;
