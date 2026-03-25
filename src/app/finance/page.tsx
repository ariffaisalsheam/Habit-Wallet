import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function FinancePage() {
  return (
    <MobileAppShell>
      <PlaceholderScreen
        title="Finance Module"
        subtitle="Next: transactions CRUD, budget planner, and CSV export."
      />
    </MobileAppShell>
  );
}
