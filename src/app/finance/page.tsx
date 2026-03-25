import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { FinanceDashboard } from "@/features/finance/components/finance-dashboard";

export default function FinancePage() {
  return (
    <MobileAppShell title="Finance">
      <FinanceDashboard />
    </MobileAppShell>
  );
}
