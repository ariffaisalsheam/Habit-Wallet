"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  Loader2,
  Lock,
  Save,
  Settings,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useConfigStore } from "@/lib/config/use-config-store";

const SECURITY_ITEMS = [
  { icon: Shield, label: "Admin Access", desc: "Controlled via Appwrite user labels. Add 'admin' label in Appwrite console to grant access." },
  { icon: Lock, label: "Middleware Route Guard", desc: "All /admin/* routes are protected via middleware cookie checks (hw_session + hw_admin)." },
  { icon: Bell, label: "Activity Logging", desc: "All admin actions (approve/reject) are logged to the admin_logs Appwrite collection." },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState<"config" | "security" | "appwrite">("config");
  const [saved, setSaved] = useState(false);
  
  const { config, isLoading, error, loadConfig, saveConfig } = useConfigStore();
  const [formData, setFormData] = useState(config);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveConfig(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error handled by store
    }
  }

  function handleNumberChange(key: keyof typeof config, value: string) {
    const num = parseInt(value, 10);
    setFormData((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-surface p-5">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform configuration, security details, and Appwrite integration info.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {(["config", "security", "appwrite"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveSection(s)}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-medium capitalize transition-all ${
              activeSection === s
                ? "bg-primary text-white"
                : "border border-border/60 text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            {s === "config" ? "Configuration" : s === "security" ? "Security" : "Appwrite"}
          </button>
        ))}
      </div>

      {/* Configuration */}
      {activeSection === "config" && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border/60 bg-surface p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Platform Configuration</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              These values apply globally and automatically reflect on user dashboards.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Configuration Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground">bKash Receive Number</span>
              <input
                type="text"
                required
                value={formData.bkashNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, bkashNumber: e.target.value }))}
                placeholder="01XXXXXXXXX"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              />
              <span className="mt-1 block text-[10px] text-muted-foreground">Number users send payment to</span>
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-foreground">Pro Price (BDT/mo)</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.proPrice}
                  onChange={(e) => handleNumberChange("proPrice", e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-foreground">3 Mo Price (BDT)</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.threeMonthPrice}
                  onChange={(e) => handleNumberChange("threeMonthPrice", e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-foreground">Annual Price (BDT)</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.annualPrice}
                  onChange={(e) => handleNumberChange("annualPrice", e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-foreground">Support Email</span>
              <input
                type="email"
                required
                value={formData.supportEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, supportEmail: e.target.value }))}
                placeholder="support@example.com"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              />
              <span className="mt-1 block text-[10px] text-muted-foreground">Displayed on payment page</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : saved ? (
              <CheckCircle2 size={15} />
            ) : (
              <Save size={15} />
            )}
            {saved ? "Saved Globally!" : "Save Configuration"}
          </button>
        </form>
      )}

      {/* Security */}
      {activeSection === "security" && (
        <div className="space-y-3">
          {SECURITY_ITEMS.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/60 bg-surface p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon size={17} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-700/40 dark:bg-amber-950/20">
            <div className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Admin Label Required</p>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-500">
                  To grant admin access to a user, go to the Appwrite console → Users → select the user → Labels → add{" "}
                  <code className="rounded bg-amber-200/60 px-1 text-[10px]">admin</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appwrite */}
      {activeSection === "appwrite" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Appwrite Integration</h3>
            <div className="mt-3 divide-y divide-border/40">
              {[
                { label: "Project ID", value: "69c3a3f10011a71ec4dd" },
                { label: "Region", value: "SGP (Singapore) via cloud.appwrite.io" },
                { label: "Database", value: "habitwallet_main" },
                { label: "Collections", value: "users, subscriptions, admin_logs, habits, ... platform_config" },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{row.label}</p>
                  <p className="font-mono text-xs text-foreground">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          <a
            href="https://cloud.appwrite.io/console/project-69c3a3f10011a71ec4dd"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-all hover:border-primary/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                <ExternalLink size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Open Appwrite Console</p>
                <p className="text-xs text-muted-foreground">Manage users, collections, and functions</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </a>
        </div>
      )}
    </div>
  );
}
