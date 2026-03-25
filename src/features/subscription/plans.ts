import type { SubscriptionTier } from "@/features/subscription/types";

export type SubscriptionPlan = {
  id: SubscriptionTier;
  name: string;
  label: string;
  monthlyPrice: number;
  features: string[];
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    label: "Free",
    monthlyPrice: 0,
    features: [
      "Unlimited habit tracking",
      "Unlimited finance tracking",
      "7-day & 30-day insights",
      "Monthly budgets and spending view",
      "Offline-first local storage",
    ],
  },
  pro: {
    id: "pro",
    name: "Professional",
    label: "Professional",
    monthlyPrice: 199,
    features: [
      "Everything in Free",
      "Cloud sync across devices",
      "90-day advanced insights",
      "Export finance report as PDF",
      "Export insights report as PDF",
      "Premium profile and avatar badge",
    ],
  },
};

export const PRO_INSIGHT_WINDOWS = [90] as const;

export function isProTier(tier: SubscriptionTier | undefined | null) {
  return tier === "pro";
}
