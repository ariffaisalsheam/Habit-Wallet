import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { ProfileAuthCard } from "@/components/auth/profile-auth-card";

export default function ProfilePage() {
  return (
    <MobileAppShell title="Profile">
      <ProfileAuthCard />
    </MobileAppShell>
  );
}
