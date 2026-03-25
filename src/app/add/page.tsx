import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { QuickAddPanel } from "@/components/add/quick-add-panel";

export default function AddPage() {
  return (
    <MobileAppShell title="Quick Add">
      <QuickAddPanel />
    </MobileAppShell>
  );
}
