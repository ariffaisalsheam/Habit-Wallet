import type { ReactNode } from "react";
import Image from "next/image";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="wellness-shell min-h-dvh bg-background">
      <div className="mx-auto min-h-dvh w-full max-w-[80rem] px-3 pb-6 pt-4 md:px-6 md:pt-7">
        <header className="rounded-[2rem] border border-border/80 bg-surface/90 px-4 py-4 shadow-[var(--soft-shadow)] backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/android-chrome-512x512.png"
              alt="HabitWallet logo"
              width={34}
              height={34}
              className="rounded-lg"
              priority
            />
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">HabitWallet</p>
              <h1 className="font-mono text-lg font-semibold leading-none text-foreground md:text-xl">Admin Dashboard</h1>
            </div>
          </div>
        </header>

        <main className="pt-4 md:pt-5">{children}</main>
      </div>
    </div>
  );
}
