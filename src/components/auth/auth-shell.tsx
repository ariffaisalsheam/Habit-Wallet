import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  altLabel: string;
  altHref: string;
  altAction: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  altLabel,
  altHref,
  altAction,
}: AuthShellProps) {
  return (
    <div className="app-noise flex min-h-dvh items-center justify-center p-4">
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-5 shadow-[0_22px_60px_-35px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Habit & Finance</p>
        <h1 className="mt-2 font-mono text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

        <div className="mt-5">{children}</div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {altLabel}{" "}
          <Link href={altHref} className="font-semibold text-primary underline-offset-4 hover:underline">
            {altAction}
          </Link>
        </p>
      </section>
    </div>
  );
}
