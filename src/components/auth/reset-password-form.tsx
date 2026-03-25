"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { completePasswordRecovery } from "@/lib/auth/service";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const secret = searchParams.get("secret") ?? "";

  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const hasToken = Boolean(userId && secret);

  const onSubmit = handleSubmit(async (values) => {
    if (!hasToken) {
      setMessage("Invalid or expired reset link.");
      setIsSuccess(false);
      return;
    }

    const result = await completePasswordRecovery({
      userId,
      secret,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });

    setIsSuccess(result.ok);
    setMessage(result.message ?? (result.ok ? "Password reset complete." : "Could not reset password."));

    if (result.ok) {
      window.setTimeout(() => {
        router.replace("/auth/login");
      }, 900);
    }
  });

  if (!hasToken) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">Invalid or expired reset link.</p>
        <Link href="/auth/forgot-password" className="block text-center text-sm font-medium text-primary underline-offset-4 hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit} noValidate>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">New password</span>
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
        {errors.confirmPassword ? <span className="mt-1 block text-xs text-red-600">{errors.confirmPassword.message}</span> : null}
      </label>

      {message ? (
        <p className={isSuccess ? "rounded-xl bg-green-100 px-3 py-2 text-sm text-green-700" : "rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700"}>
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}
