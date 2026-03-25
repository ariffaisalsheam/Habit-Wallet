"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getCachedUserProfile,
  getOrCreateUserProfile,
  updateUserProfile,
  type UserProfile,
  type UpdateUserProfileInput,
} from "@/lib/profile/service";
import { User, Phone, Globe, Languages, Save, Loader2 } from "lucide-react";
import { SubscriptionBadge } from "@/features/subscription/components/subscription-badge";
import {
  getStoredAppLanguage,
  setStoredAppLanguage,
  subscribeToAppLanguage,
  type AppLanguage,
} from "@/lib/i18n/language";
import { t } from "@/lib/i18n/translations";
import { getStoredUserSession, USER_SESSION_EVENT } from "@/lib/storage/session";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().max(20),
  country: z.string().min(2, "Country is required."),
  language: z.string().min(2, "Language is required."),
});

type ProfileValues = z.infer<typeof profileSchema>;

function subscribeToSession(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(USER_SESSION_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(USER_SESSION_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function ProfileSettingsCard() {
  const session = useSyncExternalStore(subscribeToSession, getStoredUserSession, () => null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<{ tier: "free" | "pro"; endDate: string | null } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      country: "Bangladesh",
      language: "en",
    },
  });
  const language = useSyncExternalStore<AppLanguage>(
    subscribeToAppLanguage,
    getStoredAppLanguage,
    () => "en"
  );
  const selectedLanguage = watch("language");

  useEffect(() => {
    if (selectedLanguage !== "en" && selectedLanguage !== "bn") {
      return;
    }

    if (selectedLanguage !== language) {
      setStoredAppLanguage(selectedLanguage);
    }
  }, [language, selectedLanguage]);

  useEffect(() => {
    const userId = session?.user_id;
    if (!userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const cached = getCachedUserProfile(userId);
    if (cached) {
      reset({
        name: cached.name,
        phone: cached.phone,
        country: cached.country,
        language: cached.language,
      });
      setProfile(cached);
      setSummary({ tier: cached.subscriptionTier, endDate: cached.subscriptionEndDate });
      setLoading(false);
    }

    async function loadProfile() {
      try {
        const profile = await getOrCreateUserProfile();
        if (!mounted) return;

        reset({
          name: profile.name,
          phone: profile.phone,
          country: profile.country,
          language: profile.language,
        });

        setProfile(profile);
        setSummary({ tier: profile.subscriptionTier, endDate: profile.subscriptionEndDate });
        setMessage(null);
      } catch (error) {
        if (!mounted) return;
        setMessage(error instanceof Error ? error.message : "Could not load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();
    return () => { mounted = false; };
  }, [reset, session?.user_id]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: UpdateUserProfileInput = {
      name: values.name,
      phone: values.phone,
      country: values.country,
      language: values.language,
      avatar: profile?.avatar ?? "",
    };

    try {
      const profile = await updateUserProfile(payload);
      setProfile(profile);
      reset({
        name: profile.name,
        phone: profile.phone,
        country: profile.country,
        language: profile.language,
      });
      setSummary({ tier: profile.subscriptionTier, endDate: profile.subscriptionEndDate });
      setStoredAppLanguage(profile.language === "bn" ? "bn" : "en");
      setMessage(t(language, "settings.success"));
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t(language, "settings.updateError"));
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-[2.5rem] border border-border/80 bg-surface shadow-[var(--soft-shadow)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <article className="animate-soft-rise overflow-hidden rounded-[2.5rem] border border-border/80 bg-surface shadow-[var(--soft-shadow)]">
      <div className="border-b border-border/50 bg-muted/5 p-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{t(language, "settings.accountHeading")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(language, "settings.accountDescription")}</p>
      </div>

      <div className="p-6">
        {summary && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3 border border-primary/10">
            <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{t(language, "settings.subscriptionStatus")}</span>
            <SubscriptionBadge tier={summary.tier} />
          </div>
        )}

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              <User size={14} className="text-primary" /> {t(language, "settings.fullName")}
            </label>
            <div className="relative group">
              <input 
                className="min-h-12 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm font-medium transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 group-hover:border-border-hover" 
                {...register("name")} 
              />
            </div>
            {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                <Phone size={14} className="text-primary" /> {t(language, "settings.phone")}
              </label>
              <input 
                className="min-h-12 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm font-medium transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5" 
                {...register("phone")} 
              />
              {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                <Languages size={14} className="text-primary" /> {t(language, "settings.preferredLanguage")}
              </label>
              <select 
                className="app-select min-h-12 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm font-medium transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 cursor-pointer" 
                {...register("language")}
              >
                <option value="en">{t(language, "settings.languageEnglish")}</option>
                <option value="bn">{t(language, "settings.languageBangla")}</option>
              </select>
              {errors.language && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.language.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              <Globe size={14} className="text-primary" /> {t(language, "settings.country")}
            </label>
            <input 
              className="min-h-12 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm font-medium transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5" 
              {...register("country")} 
            />
            {errors.country && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.country.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="relative inline-flex min-h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary px-6 text-sm font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0 disabled:opacity-70 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save size={18} /> {t(language, "settings.updateProfile")}
              </>
            )}
          </button>
        </form>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 text-center animate-soft-rise">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{message}</p>
        </div>
      )}
    </article>
  );
}
