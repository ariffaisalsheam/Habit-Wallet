"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerWithEmail } from "@/lib/auth/service";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);

    const result = await registerWithEmail({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (!result.ok) {
      setServerMessage(result.message ?? "Registration failed.");
      return;
    }

    router.push("/profile");
    router.refresh();
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit} noValidate>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">Name</span>
        <input
          type="text"
          autoComplete="name"
          className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="Your name"
          {...register("name")}
        />
        {errors.name ? <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span> : null}
      </label>

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
          autoComplete="new-password"
          className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="********"
          {...register("password")}
        />
        {errors.password ? <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span> : null}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">Confirm password</span>
        <input
          type="password"
          autoComplete="new-password"
          className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
          placeholder="********"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <span className="mt-1 block text-xs text-red-600">{errors.confirmPassword.message}</span>
        ) : null}
      </label>

      {serverMessage ? <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{serverMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <Link href="/" className="block text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        Back to dashboard
      </Link>
    </form>
  );
}
