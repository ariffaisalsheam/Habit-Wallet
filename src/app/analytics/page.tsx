import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { InsightsDashboard } from "@/features/analytics/components/insights-dashboard";

export default function AnalyticsPage() {
  return (
    <MobileAppShell title="Insights">
      <InsightsDashboard />
    </MobileAppShell>
  );
}
