import { Crown, Zap } from "lucide-react";
import type { SubscriptionTier } from "@/features/subscription/types";

type SubscriptionBadgeProps = {
  tier: SubscriptionTier;
  size?: "sm" | "md";
  floating?: boolean;
};

export function SubscriptionBadge({ tier, size = "sm", floating = false }: SubscriptionBadgeProps) {
  const isPro = tier === "pro";
  const sizeClass = size === "md" ? "text-xs px-3 py-1.5" : "text-[10px] px-2.5 py-1";

  if (isPro) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider premium-tier-badge ${sizeClass} ${floating ? "animate-premium-float" : ""}`}
      >
        <Crown size={12} />
        Professional
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-elevated font-bold uppercase tracking-wider text-muted-foreground ${sizeClass}`}
    >
      <Zap size={11} />
      Free
    </span>
  );
}
