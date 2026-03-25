"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginWithEmail } from "@/lib/auth/service";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    const result = await loginWithEmail(values);

    if (!result.ok) {
      setServerMessage(result.message ?? "Login failed.");
      return;
    }

    const next = searchParams.get("next");
    const destination = next && next.startsWith("/") ? next : "/profile";

    router.push(destination);
    router.refresh();
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit} noValidate>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">Email</span>
        <input
          type="email"
          autoComplete="email"
          className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email ? <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span> : null}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="********"
          {...register("password")}
        />
        {errors.password ? <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span> : null}
      </label>

      <div className="text-right">
        <Link href="/auth/forgot-password" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </div>

      {serverMessage ? <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{serverMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <Link href="/" className="block text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        Back to dashboard
      </Link>
    </form>
  );
}
