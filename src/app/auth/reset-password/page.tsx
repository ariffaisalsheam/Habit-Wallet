import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Set a new password for your HabitWallet account."
      altLabel="Need a fresh link?"
      altHref="/auth/forgot-password"
      altAction="Request reset"
    >
      <Suspense fallback={<div className="h-10 animate-pulse bg-border/20" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
