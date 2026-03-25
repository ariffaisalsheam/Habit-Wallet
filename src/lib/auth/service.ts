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

function mapError(error: unknown) {
  if (error instanceof Error && error.message) {
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

export async function registerWithEmail(input: RegisterInput): Promise<AuthResult> {
  if (!hasAppwriteConfig()) {
    return missingConfigResult();
  }

  try {
    const account = createAccount();

    await account.create(ID.unique(), input.email, input.password, input.name);
    await account.createEmailPasswordSession(input.email, input.password);
    const user = await account.get();

    saveUserSession({
      user_id: user.$id,
      email: user.email,
      name: user.name,
      auth_timestamp: Date.now(),
    });

    return {
      ok: true,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      },
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

    saveUserSession({
      user_id: user.$id,
      email: user.email,
      name: user.name,
      auth_timestamp: Date.now(),
    });

    return {
      ok: true,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      },
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
