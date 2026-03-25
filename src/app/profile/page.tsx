"use client";

import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { ProfileAuthCard } from "@/components/auth/profile-auth-card";
import { ProfileSettingsCard } from "@/components/auth/profile-settings-card";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getStoredAppLanguage, subscribeToAppLanguage } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/translations";

export default function ProfilePage() {
  const language = useSyncExternalStore(subscribeToAppLanguage, getStoredAppLanguage, () => "en");

  return (
    <MobileAppShell title={t(language, "title.profile")}>
      <section className="mx-auto max-w-3xl space-y-6 pb-12 animate-soft-rise">
        
        {/* Header Hero Section */}
        <header className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 text-white shadow-2xl">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          
          <div className="relative z-10 space-y-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{t(language, "profile.pageHeading")}</h1>
              <p className="mt-2 text-sm font-medium text-white/80 max-w-sm">
                {t(language, "profile.pageDescription")}
              </p>
            </div>
          </div>
        </header>

        {/* Identity & Session */}
        <div className="grid grid-cols-1 gap-6">
          <ProfileAuthCard />
          <ProfileSettingsCard />
        </div>

        {/* Pro Plan Promotion / Management */}
        <article className="group relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-surface-elevated p-8 shadow-[var(--soft-shadow)] transition-all hover:translate-y-[-4px] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl transition-colors group-hover:bg-amber-500/10" />
          
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-bold tracking-tight text-foreground">{t(language, "profile.premiumHeading")}</h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {t(language, "profile.premiumDescription")}
              </p>
            </div>

            <Link
              href="/subscription"
              className="inline-flex min-h-14 items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 px-8 text-sm font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              {t(language, "profile.subscriptionCta")} <ArrowRight size={16} />
            </Link>
          </div>
        </article>

        {/* Footer Info */}
        <footer className="text-center pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">
            {t(language, "profile.footer")}
          </p>
        </footer>

      </section>
    </MobileAppShell>
  );
}
