import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Suspense } from "react";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we will send a secure reset link."
      altLabel="Remembered your password?"
      altHref="/auth/login"
      altAction="Sign in"
    >
      <Suspense fallback={<div className="h-10 animate-pulse bg-border/20" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
