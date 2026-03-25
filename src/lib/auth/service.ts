import { ID } from "appwrite";
import { createAccount } from "@/lib/appwrite/account";
import { hasAppwriteConfig } from "@/lib/config/env";
import { clearUserSession, saveUserSession } from "@/lib/storage/session";
import type { AuthResult } from "@/lib/auth/types";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type CompleteRecoveryInput = {
  userId: string;
  secret: string;
  password: string;
  confirmPassword: string;
};

function extractLabels(user: unknown): string[] {
  if (!user || typeof user !== "object") {
    return [];
  }

  const labels = (user as { labels?: unknown }).labels;
  if (!Array.isArray(labels)) {
    return [];
  }

  return labels.filter((label): label is string => typeof label === "string");
}

function mapUser(user: {
  $id: string;
  email: string;
  name: string;
  labels?: unknown;
  emailVerification?: boolean;
}) {
  const labels = extractLabels(user);
  const isAdmin = labels.includes("admin");

  return {
    id: user.$id,
    email: user.email,
    name: user.name,
    labels,
    isAdmin,
    emailVerification: Boolean(user.emailVerification),
  };
}

function mapError(error: unknown) {
  if (error instanceof Error && error.message) {
    const message = error.message.toLowerCase();

    if (message.includes("user_invalid_credentials")) {
      return "Invalid email or password.";
    }

    if (message.includes("user_email_already_exists")) {
      return "This email is already registered.";
    }

    if (message.includes("user_session_not_found") || message.includes("user_unauthorized")) {
      return "Your session has expired. Please sign in again.";
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function missingConfigResult(): AuthResult {
  return {
    ok: false,
    message:
      "Missing Appwrite config. Add NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local.",
  };
}

function authRedirectUrl(pathname: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${pathname}`;
  }

  return `http://localhost:3000${pathname}`;
}

export async function registerWithEmail(input: RegisterInput): Promise<AuthResult> {
  if (!hasAppwriteConfig()) {
    return missingConfigResult();
  }

  try {
    const account = createAccount();

    await account.create(ID.unique(), input.email, input.password, input.name);
    await account.createEmailPasswordSession(input.email, input.password);
    try {
      await account.createVerification(authRedirectUrl("/auth/verify-email"));
    } catch {
      // Non-blocking: account creation should not fail if verification email send fails.
    }

    const user = await account.get();
    const mapped = mapUser(user);

    saveUserSession({
      user_id: mapped.id,
      email: mapped.email,
      name: mapped.name,
      labels: mapped.labels,
      is_admin: mapped.isAdmin,
      email_verified: mapped.emailVerification,
      auth_timestamp: Date.now(),
    });

    return {
      ok: true,
      user: mapped,
    };
  } catch (error) {
    return {
      ok: false,
      message: mapError(error),
    };
  }
}

export async function loginWithEmail(input: LoginInput): Promise<AuthResult> {
  if (!hasAppwriteConfig()) {
    return missingConfigResult();
  }

  try {
    const account = createAccount();

    await account.createEmailPasswordSession(input.email, input.password);
    const user = await account.get();
    const mapped = mapUser(user);

    saveUserSession({
      user_id: mapped.id,
      email: mapped.email,
      name: mapped.name,
      labels: mapped.labels,
      is_admin: mapped.isAdmin,
      email_verified: mapped.emailVerification,
      auth_timestamp: Date.now(),
    });

    return {
      ok: true,
      user: mapped,
    };
  } catch (error) {
    return {
      ok: false,
      message: mapError(error),
    };
  }
}

export async function logoutUser(): Promise<AuthResult> {
  if (!hasAppwriteConfig()) {
    clearUserSession();
    return {
      ok: true,
      message: "Local session cleared.",
    };
  }

  try {
    const account = createAccount();
    await account.deleteSession("current");
    clearUserSession();

    return {
      ok: true,
      message: "Logged out.",
    };
  } catch (error) {
    return {
      ok: false,
      message: mapError(error),
    };
  }
}

export async function getCurrentAuthUser(): Promise<AuthResult> {
  if (!hasAppwriteConfig()) {
    return missingConfigResult();
  }

  try {
    const account = createAccount();
    const user = await account.get();
    const mapped = mapUser(user);

    return {
      ok: true,
      user: mapped,
    };
  } catch (error) {
    return {
      ok: false,
      message: mapError(error),
    };
  }
}

export async function refreshStoredSession() {
  const result = await getCurrentAuthUser();

  if (!result.ok || !result.user) {
    clearUserSession();
    return result;
  }

  saveUserSession({
    user_id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    labels: result.user.labels,
    is_admin: result.user.isAdmin,
    email_verified: result.user.emailVerification,
    auth_timestamp: Date.now(),
  });

  return result;
}

export function userHasAdminLabel(labels: string[] | undefined) {
  if (!labels?.length) {
    return false;
  }

  return labels.includes("admin");
}

export async function sendPasswordRecoveryEmail(email: string): Promise<AuthResult> {
  if (!hasAppwriteConfig()) {
    return missingConfigResult();
  }

  try {
    const account = createAccount();
    await account.createRecovery(email.trim(), authRedirectUrl("/auth/reset-password"));

    return {
      ok: true,
      message: "Password reset link sent. Check your email inbox.",
    };
  } catch (error) {
    return {
      ok: false,
      message: mapError(error),
    };
  }
}

export async function completePasswordRecovery(input: CompleteRecoveryInput): Promise<AuthResult> {
  if (!hasAppwriteConfig()) {
    return missingConfigResult();
  }

  if (input.password !== input.confirmPassword) {
    return {
      ok: false,
      message: "Passwords do not match.",
    };
  }

  try {
    const account = createAccount();
    await account.updateRecovery(input.userId, input.secret, input.password);

    return {
      ok: true,
      message: "Password updated. You can sign in now.",
    };
  } catch (error) {
    return {
      ok: false,
      message: mapError(error),
    };
  }
}

export async function sendEmailVerification(): Promise<AuthResult> {
  if (!hasAppwriteConfig()) {
    return missingConfigResult();
  }

  try {
    const account = createAccount();
    await account.createVerification(authRedirectUrl("/auth/verify-email"));

    return {
      ok: true,
      message: "Verification email sent.",
    };
  } catch (error) {
    return {
      ok: false,
      message: mapError(error),
    };
  }
}

export async function confirmEmailVerification(userId: string, secret: string): Promise<AuthResult> {
  if (!hasAppwriteConfig()) {
    return missingConfigResult();
  }

  try {
    const account = createAccount();
    await account.updateVerification(userId, secret);

    return {
      ok: true,
      message: "Email verified successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      message: mapError(error),
    };
  }
}
