"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getOrCreateUserProfile,
  type UpdateUserProfileInput,
  updateUserProfile,
} from "@/lib/profile/service";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().max(20),
  avatar: z.string().url("Enter a valid image URL.").or(z.literal("")),
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
      avatar: "",
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
          avatar: profile.avatar,
          country: profile.country,
          language: profile.language,
        });

        setSummary({ tier: profile.subscriptionTier, endDate: profile.subscriptionEndDate });
        setMessage(null);
      } catch (error) {
        if (!mounted) return;
        setMessage(error instanceof Error ? error.message : "Could not load profile.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: UpdateUserProfileInput = {
      name: values.name,
      phone: values.phone,
      avatar: values.avatar,
      country: values.country,
      language: values.language,
    };

    try {
      const profile = await updateUserProfile(payload);
      setSummary({ tier: profile.subscriptionTier, endDate: profile.subscriptionEndDate });
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile update failed.");
    }
  });

  return (
    <article className="rounded-[2rem] border border-border/80 bg-surface p-4 shadow-[var(--soft-shadow)]">
      <h2 className="text-base font-semibold text-foreground">Profile settings</h2>
      <p className="mt-1 text-xs text-muted-foreground">Your profile is now saved in Appwrite and synced across sessions.</p>

      {summary ? (
        <p className="mt-2 rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
          Plan: <span className="font-semibold text-foreground uppercase">{summary.tier}</span>
          {summary.endDate ? ` · Pro active until ${summary.endDate}` : " · No active paid plan"}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading profile...</p>
      ) : (
        <form className="mt-3 space-y-3" onSubmit={onSubmit} noValidate>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Name</span>
            <input className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" {...register("name")} />
            {errors.name ? <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span> : null}
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Phone</span>
              <input className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" {...register("phone")} />
              {errors.phone ? <span className="mt-1 block text-xs text-red-600">{errors.phone.message}</span> : null}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Language</span>
              <input className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" {...register("language")} />
              {errors.language ? <span className="mt-1 block text-xs text-red-600">{errors.language.message}</span> : null}
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Avatar URL</span>
            <input
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="https://example.com/avatar.png"
              {...register("avatar")}
            />
            {errors.avatar ? <span className="mt-1 block text-xs text-red-600">{errors.avatar.message}</span> : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Country</span>
            <input className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" {...register("country")} />
            {errors.country ? <span className="mt-1 block text-xs text-red-600">{errors.country.message}</span> : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
          >
            {isSubmitting ? "Saving..." : "Save profile"}
          </button>
        </form>
      )}

      {message ? <p className="mt-3 rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">{message}</p> : null}
    </article>
  );
}
