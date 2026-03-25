import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { SubscriptionDashboard } from "@/features/subscription/components/subscription-dashboard";

export default function SubscriptionPage() {
  return (
    <MobileAppShell title="Subscription">
      <SubscriptionDashboard />
    </MobileAppShell>
  );
}
