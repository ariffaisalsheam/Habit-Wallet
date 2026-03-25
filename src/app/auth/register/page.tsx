import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking daily habits and money flow with offline-first reliability."
      altLabel="Already have an account?"
      altHref="/auth/login"
      altAction="Sign in"
    >
      <Suspense fallback={<div className="h-10 animate-pulse bg-border/20" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
