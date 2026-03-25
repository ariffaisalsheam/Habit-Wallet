import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to sync habits, finances, and premium features across devices."
      altLabel="Need an account?"
      altHref="/auth/register"
      altAction="Create one"
    >
      <LoginForm />
    </AuthShell>
  );
}
