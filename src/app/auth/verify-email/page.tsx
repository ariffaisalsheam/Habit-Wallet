import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailCard } from "@/components/auth/verify-email-card";
import { Suspense } from "react";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="Confirm your email to keep your account secure and recoverable."
      altLabel="Need to sign in?"
      altHref="/auth/login"
      altAction="Go to login"
    >
      <Suspense fallback={<div className="h-10 animate-pulse bg-border/20" />}>
        <VerifyEmailCard />
      </Suspense>
    </AuthShell>
  );
}
