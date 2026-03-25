import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { ProfileAuthCard } from "@/components/auth/profile-auth-card";
import { ProfileSettingsCard } from "@/components/auth/profile-settings-card";
import Link from "next/link";
import { BadgeDollarSign } from "lucide-react";

export default function ProfilePage() {
  return (
    <MobileAppShell title="Profile">
      <section className="space-y-4 pb-8">
        <ProfileAuthCard />
        <ProfileSettingsCard />

        <article className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
          <h2 className="text-base font-semibold text-foreground">Account tools</h2>
          <p className="mt-1 text-xs text-muted-foreground">Manage your HabitWallet Pro plan.</p>

          <div className="mt-3 grid grid-cols-1 gap-2">
            <Link
              href="/subscription"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white"
            >
              <BadgeDollarSign size={16} /> Subscription
            </Link>
          </div>
        </article>
      </section>
    </MobileAppShell>
  );
}
