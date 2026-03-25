import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function AddPage() {
  return (
    <MobileAppShell>
      <PlaceholderScreen
        title="Quick Add"
        subtitle="Next: one-thumb entry form for transactions and daily habit check-ins."
      />
    </MobileAppShell>
  );
}
