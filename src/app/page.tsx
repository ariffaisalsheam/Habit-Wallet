import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { HabitsDashboard } from "@/features/habits/components/habits-dashboard";

export default function Home() {
  return (
    <MobileAppShell title="Habits">
      <HabitsDashboard />
    </MobileAppShell>
  );
}
