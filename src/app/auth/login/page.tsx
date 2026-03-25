import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to sync habits, finances, and premium features across devices."
      altLabel="Need an account?"
      altHref="/auth/register"
      altAction="Create one"
    >
      <Suspense fallback={<div className="h-10 animate-pulse bg-border/20" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
