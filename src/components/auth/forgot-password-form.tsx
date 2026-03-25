"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordRecoveryEmail } from "@/lib/auth/service";

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    setIsSuccess(false);

    const result = await sendPasswordRecoveryEmail(values.email);

    setIsSuccess(result.ok);
    setMessage(result.message ?? (result.ok ? "Recovery email sent." : "Recovery failed."));
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
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>

      <Link href="/auth/login" className="block text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
