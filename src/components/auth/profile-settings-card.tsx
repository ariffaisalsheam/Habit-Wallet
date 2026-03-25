"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getOrCreateUserProfile,
  updateUserProfile,
  type UpdateUserProfileInput,
} from "@/lib/profile/service";
import { User, Phone, Globe, Languages, Save, Loader2, Sparkles } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().max(20),
  country: z.string().min(2, "Country is required."),
  language: z.string().min(2, "Language is required."),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ tier: "free" | "pro"; endDate: string | null } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    reset,
    handleSubmit,
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

  useEffect(() => {
    let mounted = true;

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
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: UpdateUserProfileInput = {
      name: values.name,
      phone: values.phone,
      country: values.country,
      language: values.language,
      avatar: "", // Handled separately via uploadAvatar if needed, but keeping it in the store
    };

    try {
      const profile = await updateUserProfile(payload);
      setSummary({ tier: profile.subscriptionTier, endDate: profile.subscriptionEndDate });
      setMessage("Profile settings updated successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile update failed.");
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
        <h2 className="text-xl font-bold tracking-tight text-foreground">Account Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Modify your identity and regional preferences.</p>
      </div>

      <div className="p-6">
        {summary && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3 border border-primary/10">
            <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">Subscription Status</span>
            <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${summary.tier === 'pro' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-secondary/20 text-secondary'}`}>
              {summary.tier}
            </span>
          </div>
        )}

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              <User size={14} className="text-primary" /> Full Name
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
                <Phone size={14} className="text-primary" /> Phone Number
              </label>
              <input 
                className="min-h-12 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm font-medium transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5" 
                {...register("phone")} 
              />
              {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                <Languages size={14} className="text-primary" /> Preferred Language
              </label>
              <select 
                className="min-h-12 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm font-medium transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 cursor-pointer appearance-none" 
                {...register("language")}
              >
                <option value="en">English (Global)</option>
                <option value="bn">Bengali (Native)</option>
              </select>
              {errors.language && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.language.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              <Globe size={14} className="text-primary" /> Home Region/Country
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
                <Save size={18} /> Update Profile
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
