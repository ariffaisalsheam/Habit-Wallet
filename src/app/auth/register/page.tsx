import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking daily habits and money flow with offline-first reliability."
      altLabel="Already have an account?"
      altHref="/auth/login"
      altAction="Sign in"
    >
      <RegisterForm />
    </AuthShell>
  );
}
