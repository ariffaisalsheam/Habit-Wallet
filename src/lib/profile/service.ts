import { createDatabases, q } from "@/lib/appwrite/databases";
import { getCurrentAuthUser } from "@/lib/auth/service";
import { appwriteEnv, hasCollectionsConfig, hasDatabaseConfig } from "@/lib/config/env";

export type UserProfile = {
  userId: string;
  email: string;
  name: string;
  phone: string;
  avatar: string;
  country: string;
  language: string;
  subscriptionTier: "free" | "pro";
  subscriptionEndDate: string | null;
  updatedAt: string;
};

type ProfileDocument = {
  $id?: string;
  userId: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  country?: string;
  language?: string;
  subscriptionTier?: "free" | "pro";
  subscriptionEndDate?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

export type UpdateUserProfileInput = {
  name: string;
  phone: string;
  avatar: string;
  country: string;
  language: string;
};

function ensureDbReady() {
  if (!hasDatabaseConfig() || !hasCollectionsConfig()) {
    throw new Error("Missing Appwrite database configuration for profile backend.");
  }
}

function mapProfile(doc: ProfileDocument, fallback: { userId: string; email: string; name: string }): UserProfile {
  return {
    userId: doc.userId || fallback.userId,
    email: doc.email || fallback.email,
    name: doc.name || fallback.name,
    phone: doc.phone ?? "",
    avatar: doc.avatar ?? "",
    country: doc.country ?? "Bangladesh",
    language: doc.language ?? "en",
    subscriptionTier: doc.subscriptionTier ?? "free",
    subscriptionEndDate: doc.subscriptionEndDate ?? null,
    updatedAt: doc.updatedAt ?? new Date().toISOString(),
  };
}

async function createDefaultProfile(user: { id: string; email: string; name: string }) {
  const databases = createDatabases();
  const now = new Date().toISOString();

  const payload: ProfileDocument = {
    userId: user.id,
    email: user.email,
    name: user.name,
    phone: "",
    avatar: "",
    country: "Bangladesh",
    language: "en",
    subscriptionTier: "free",
    subscriptionEndDate: null,
    createdAt: now,
    updatedAt: now,
  };

  const document = (await databases.createDocument(
    appwriteEnv.databaseId,
    appwriteEnv.usersCollectionId,
    user.id,
    payload
  )) as unknown as ProfileDocument;

  return mapProfile(document, { userId: user.id, email: user.email, name: user.name });
}

async function findProfileByUserId(userId: string) {
  const response = await createDatabases().listDocuments(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, [
    q.equal("userId", userId),
    q.limit(1),
  ]);

  if (!response.documents.length) {
    return null;
  }

  return response.documents[0] as unknown as ProfileDocument;
}

export async function getOrCreateUserProfile() {
  ensureDbReady();

  const auth = await getCurrentAuthUser();
  if (!auth.ok || !auth.user) {
    throw new Error(auth.message ?? "Please sign in to access your profile.");
  }

  const existing = await findProfileByUserId(auth.user.id);

  if (existing) {
    return mapProfile(existing, {
      userId: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
    });
  }

  return createDefaultProfile({
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
  });
}

export async function updateUserProfile(input: UpdateUserProfileInput) {
  ensureDbReady();

  const auth = await getCurrentAuthUser();
  if (!auth.ok || !auth.user) {
    throw new Error(auth.message ?? "Please sign in to update your profile.");
  }

  const databases = createDatabases();
  const existing = await findProfileByUserId(auth.user.id);
  const payload: Partial<ProfileDocument> = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    avatar: input.avatar.trim(),
    country: input.country.trim(),
    language: input.language.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (!existing?.$id) {
    const created = (await databases.createDocument(
      appwriteEnv.databaseId,
      appwriteEnv.usersCollectionId,
      auth.user.id,
      {
        userId: auth.user.id,
        email: auth.user.email,
        name: payload.name ?? auth.user.name,
        phone: payload.phone ?? "",
        avatar: payload.avatar ?? "",
        country: payload.country ?? "Bangladesh",
        language: payload.language ?? "en",
        subscriptionTier: "free",
        subscriptionEndDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: payload.updatedAt,
      }
    )) as unknown as ProfileDocument;

    return mapProfile(created, {
      userId: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
    });
  }

  const document = (await databases.updateDocument(
    appwriteEnv.databaseId,
    appwriteEnv.usersCollectionId,
    existing.$id,
    payload
  )) as unknown as ProfileDocument;

  return mapProfile(document, {
    userId: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
  });
}

export async function getActiveSubscriptionFromProfiles(userId: string) {
  ensureDbReady();

  const document = await findProfileByUserId(userId);

  if (!document) {
    return {
      tier: "free" as const,
      endDate: null,
    };
  }

  return {
    tier: document.subscriptionTier ?? "free",
    endDate: document.subscriptionEndDate ?? null,
  };
}

export async function upsertSubscriptionTier(userId: string, tier: "free" | "pro", endDate: string | null) {
  ensureDbReady();

  const databases = createDatabases();
  const now = new Date().toISOString();
  const existing = await findProfileByUserId(userId);

  if (existing?.$id) {
    await databases.updateDocument(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, existing.$id, {
      subscriptionTier: tier,
      subscriptionEndDate: endDate,
      updatedAt: now,
    });
    return;
  }

  await databases.createDocument(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, userId, {
    userId,
    email: "",
    name: "",
    phone: "",
    avatar: "",
    country: "Bangladesh",
    language: "en",
    subscriptionTier: tier,
    subscriptionEndDate: endDate,
    createdAt: now,
    updatedAt: now,
  });
}

export async function listTopProfiles(limit = 10) {
  ensureDbReady();

  const databases = createDatabases();
  return databases.listDocuments(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, [
    q.orderDesc("updatedAt"),
    q.limit(limit),
  ]);
}
