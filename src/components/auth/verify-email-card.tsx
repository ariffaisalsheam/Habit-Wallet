"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { confirmEmailVerification, sendEmailVerification } from "@/lib/auth/service";

export function VerifyEmailCard() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const secret = searchParams.get("secret") ?? "";

  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleVerify() {
    setBusy(true);
    setMessage(null);

    const result = await confirmEmailVerification(userId, secret);
    setIsSuccess(result.ok);
    setMessage(result.message ?? (result.ok ? "Email verified." : "Could not verify email."));
    setBusy(false);
  }

  async function handleResend() {
    setBusy(true);
    setMessage(null);

    const result = await sendEmailVerification();
    setIsSuccess(result.ok);
    setMessage(result.message ?? (result.ok ? "Verification email sent." : "Could not send verification email."));
    setBusy(false);
  }

  const hasToken = Boolean(userId && secret);

  return (
    <div className="space-y-3">
      {message ? (
        <p className={isSuccess ? "rounded-xl bg-green-100 px-3 py-2 text-sm text-green-700" : "rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700"}>
          {message}
        </p>
      ) : null}

      {hasToken ? (
        <button
          type="button"
          onClick={handleVerify}
          disabled={busy}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? "Verifying..." : "Confirm email"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={busy}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? "Sending..." : "Resend verification email"}
        </button>
      )}

      <Link href="/auth/login" className="block text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
