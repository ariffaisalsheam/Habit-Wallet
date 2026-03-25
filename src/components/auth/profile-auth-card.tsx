"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useRef } from "react";
import { logoutUser, refreshStoredSession } from "@/lib/auth/service";
import { USER_SESSION_EVENT, getStoredUserSession } from "@/lib/storage/session";
import { uploadAvatar, updateProfileName, UserProfile, getCachedUserProfile, getOrCreateUserProfile } from "@/lib/profile/service";
import { Camera, Edit2, Check, X, Loader2, Crown, Zap } from "lucide-react";
import { SubscriptionBadge } from "@/features/subscription/components/subscription-badge";

function subscribeToSession(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === "hft_user_session") {
      onStoreChange();
    }
  };

  const onSessionEvent = () => {
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(USER_SESSION_EVENT, onSessionEvent);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(USER_SESSION_EVENT, onSessionEvent);
  };
}

export function ProfileAuthCard() {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeToSession, getStoredUserSession, () => null);
  const sessionUserId = session?.user_id;
  const sessionName = session?.name;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session || !sessionUserId) {
      setProfile(null);
      setNewName("");
      return;
    }

    const cached = getCachedUserProfile(sessionUserId);
    if (cached) {
      setProfile(cached);
      setNewName(cached.name);
    } else {
      setNewName(sessionName ?? "");
    }

    let mounted = true;

    async function refresh() {
      const result = await refreshStoredSession();
      if (!mounted) return;

      if (!result.ok && typeof navigator !== "undefined" && navigator.onLine) {
        setMessage(result.message ?? "Session refresh failed. Working with local data.");
      }

      try {
        const up = await getOrCreateUserProfile();
        if (!mounted) return;
        setProfile(up);
        setNewName(up.name);
      } catch {
        // Keep cached profile visible for offline-first behavior.
      }
    }

    void refresh();

    return () => {
      mounted = false;
    };
  }, [session, sessionName, sessionUserId]);

  async function handleLogout() {
    setBusy(true);
    setMessage(null);

    const result = await logoutUser();

    if (!result.ok) {
      setMessage(result.message ?? "Logout failed.");
      setBusy(false);
      return;
    }

    setBusy(false);
    setMessage("Signed out successfully.");
    router.refresh();
  }

  async function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Max 2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage("ERROR: File too large (Max 2MB)");
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    // Professional handle for files > 1MB
    if (file.size > 1 * 1024 * 1024) {
      setMessage("Processing large image... please wait.");
    }

    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setProfile((p) => (p ? { ...p, avatar: url } : null));
      setMessage("Avatar updated successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveName() {
    if (!newName.trim() || newName === profile?.name) {
      setIsEditingName(false);
      return;
    }

    setBusy(true);
    try {
      await updateProfileName(newName);
      setProfile((p) => (p ? { ...p, name: newName } : null));
      setIsEditingName(false);
      setMessage("Name updated!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const isAuthenticated = Boolean(session);
  const isPro = profile?.subscriptionTier === "pro";

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-surface p-6 shadow-[var(--soft-shadow)]">
      {/* Decorative Background Elements */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground">My Profile</h2>
          {isAuthenticated && (
            <div className="select-none">
              <SubscriptionBadge tier={isPro ? "pro" : "free"} floating={isPro} />
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div className="mt-8 flex flex-col items-center gap-6">
            {/* Avatar Section */}
            <div className="group relative">
              <div 
                onClick={handleAvatarClick}
                className={`relative h-24 w-24 cursor-pointer overflow-hidden rounded-[2rem] border-4 border-surface-elevated shadow-xl transition-transform active:scale-95 ${isPro ? 'animate-avatar-pulse border-amber-400/30' : ''}`}
              >
                {uploading ? (
                  <div className="flex h-full w-full items-center justify-center bg-muted/20 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : profile?.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt="Avatar"
                    width={96}
                    height={96}
                    unoptimized
                    className="h-full w-full object-cover"
                    key={profile.avatar}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 text-center">
                    <span className="text-2xl font-bold text-primary">
                      {(profile?.name || session?.name || "?")[0]}
                    </span>
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={20} className="text-white" />
                </div>
              </div>

              <span className={`avatar-tier-dot ${isPro ? "" : "avatar-tier-dot-free"}`}>
                {isPro ? <Crown size={10} /> : <Zap size={9} />}
              </span>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            {/* Name Section */}
            <div className="flex flex-col items-center gap-1 text-center w-full">
              {isEditingName ? (
                <div className="flex items-center justify-center gap-2 w-full">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="h-9 w-40 rounded-xl border border-primary/50 bg-background px-3 text-center text-base font-semibold focus:outline-none"
                  />
                  <button onClick={saveName} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button onClick={() => setIsEditingName(false)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 w-full group">
                  <div className="w-3.5" /> {/* Spacer to balance the edit icon for better centering */}
                  <h3 className="text-lg font-bold text-foreground">
                    {profile?.name || session?.name || "Unnamed User"}
                  </h3>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 flex items-center"
                  >
                    <Edit2 size={14} className="text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{session?.email}</p>
              
              {!session?.email_verified && (
                <Link 
                  href="/auth/verify-email" 
                  className="mt-2 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 transition-colors hover:bg-amber-500/20"
                >
                  Verify Email
                </Link>
              )}
            </div>

            <div className="grid w-full grid-cols-1 gap-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-secondary/10 px-4 text-sm font-bold text-secondary transition hover:bg-secondary/20 disabled:opacity-70"
              >
                {busy ? <Loader2 className="animate-spin" /> : "Sign out"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Sign in to enable cloud sync and unlock premium habits & analytics.
            </p>
            <div className="flex gap-3">
              <Link
                href="/auth/login"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition hover:bg-background"
              >
                Join Now
              </Link>
            </div>
          </div>
        )}

        {message && (
          <div className="mt-4 animate-soft-rise text-center">
            <span className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${message.includes('ERROR') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {message}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
