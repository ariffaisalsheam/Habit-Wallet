"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, WalletCards } from "lucide-react";

const upcoming = [
  "Finance CRUD + category budgets",
  "Habit streak check-ins and calendar history",
  "Appwrite auth and offline sync queue",
];

export function StarterOverview() {
  return (
    <section className="space-y-4 pb-8">
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-3xl border border-border bg-surface p-4 shadow-[0_22px_60px_-35px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Today</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Bhalo progress</h2>
          </div>
          <span className="rounded-full bg-accent/25 px-3 py-1 text-xs font-semibold text-foreground">
            Offline Ready Base
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-primary p-3 text-white">
            <p className="text-xs uppercase tracking-wide text-white/75">Spent</p>
            <p className="mt-1 text-2xl font-bold">৳ 4,230</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-white/85">
              This week <ArrowUpRight size={14} />
            </p>
          </div>
          <div className="rounded-2xl bg-secondary p-3 text-white">
            <p className="text-xs uppercase tracking-wide text-white/75">Habits</p>
            <p className="mt-1 text-2xl font-bold">6 / 8</p>
            <p className="mt-2 text-xs text-white/85">completed today</p>
          </div>
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4, ease: "easeOut" }}
        className="rounded-3xl border border-border bg-surface p-4"
      >
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <WalletCards size={18} className="text-primary" />
          Initialization Snapshot
        </h3>

        <ul className="mt-3 space-y-2">
          {upcoming.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <BadgeCheck size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </motion.article>
    </section>
  );
}
