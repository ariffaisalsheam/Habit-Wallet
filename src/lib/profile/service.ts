import { storage, databases, q } from "@/lib/appwrite";
import { ID } from "appwrite";
import { getCurrentAuthUser } from "@/lib/auth/service";
import { appwriteEnv, hasCollectionsConfig, hasDatabaseConfig } from "@/lib/config/env";
import { STORAGE_KEYS } from "@/lib/storage/keys";

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

function canUseStorage() {
  return typeof window !== "undefined";
}

function profileCacheKey(userId: string) {
  return `${STORAGE_KEYS.profileCachePrefix}${userId}`;
}

function writeProfileCache(profile: UserProfile) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(profileCacheKey(profile.userId), JSON.stringify(profile));
}

function safeParseProfile(raw: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (!parsed.userId || !parsed.email || !parsed.name) return null;

    return {
      userId: parsed.userId,
      email: parsed.email,
      name: parsed.name,
      phone: parsed.phone ?? "",
      avatar: parsed.avatar ?? "",
      country: parsed.country ?? "Bangladesh",
      language: parsed.language ?? "en",
      subscriptionTier: parsed.subscriptionTier === "pro" ? "pro" : "free",
      subscriptionEndDate: parsed.subscriptionEndDate ?? null,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    } as UserProfile;
  } catch {
    return null;
  }
}

export function getCachedUserProfile(userId: string) {
  if (!canUseStorage()) return null;

  const parsed = safeParseProfile(window.localStorage.getItem(profileCacheKey(userId)));
  if (!parsed) {
    window.localStorage.removeItem(profileCacheKey(userId));
  }
  return parsed;
}

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

  const mapped = mapProfile(document, { userId: user.id, email: user.email, name: user.name });
  writeProfileCache(mapped);
  return mapped;
}

async function findProfileByUserId(userId: string) {
  const response = await databases.listDocuments(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, [
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
    const mapped = mapProfile(existing, {
      userId: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
    });

    writeProfileCache(mapped);
    return mapped;
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

    const mapped = mapProfile(created, {
      userId: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
    });

    writeProfileCache(mapped);
    return mapped;
  }

  const document = (await databases.updateDocument(
    appwriteEnv.databaseId,
    appwriteEnv.usersCollectionId,
    existing.$id,
    payload
  )) as unknown as ProfileDocument;

  const mapped = mapProfile(document, {
    userId: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
  });

  writeProfileCache(mapped);
  return mapped;
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

  const now = new Date().toISOString();
  const existing = await findProfileByUserId(userId);

  if (existing?.$id) {
    const updatedAt = new Date().toISOString();

    await databases.updateDocument(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, existing.$id, {
      subscriptionTier: tier,
      subscriptionEndDate: endDate,
      updatedAt,
    });

    writeProfileCache(
      mapProfile(
        {
          ...existing,
          subscriptionTier: tier,
          subscriptionEndDate: endDate,
          updatedAt,
        },
        {
          userId,
          email: existing.email ?? "",
          name: existing.name ?? "",
        }
      )
    );

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

  writeProfileCache({
    userId,
    email: "",
    name: "",
    phone: "",
    avatar: "",
    country: "Bangladesh",
    language: "en",
    subscriptionTier: tier,
    subscriptionEndDate: endDate,
    updatedAt: now,
  });
}

export async function listTopProfiles(limit = 10) {
  ensureDbReady();
  return databases.listDocuments(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, [
    q.orderDesc("updatedAt"),
    q.limit(limit),
  ]);
}

export async function uploadAvatar(file: File) {
  ensureDbReady();
  const auth = await getCurrentAuthUser();
  if (!auth.ok || !auth.user) throw new Error("Please sign in.");
  const now = new Date().toISOString();

  // 1. Upload file
  const uploaded = await storage.createFile(appwriteEnv.avatarsBucketId, ID.unique(), file);

  // 2. Get file preview URL
  const avatarUrl = `${appwriteEnv.endpoint}/storage/buckets/${appwriteEnv.avatarsBucketId}/files/${uploaded.$id}/view?project=${appwriteEnv.projectId}`;

  // 3. Update profile
  const existing = await findProfileByUserId(auth.user.id);
  if (existing?.$id) {
    if (existing.avatar) {
      try {
        const oldFileId = existing.avatar.split("/files/")[1]?.split("/")[0];
        if (oldFileId) await storage.deleteFile(appwriteEnv.avatarsBucketId, oldFileId);
      } catch (e) {
        console.warn("Failed to delete old avatar:", e);
      }
    }

    await databases.updateDocument(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, existing.$id, {
      avatar: avatarUrl,
      updatedAt: now,
    });

    writeProfileCache(
      mapProfile(
        {
          ...existing,
          avatar: avatarUrl,
          updatedAt: now,
        },
        {
          userId: auth.user.id,
          email: auth.user.email,
          name: auth.user.name,
        }
      )
    );
  } else {
    await createDefaultProfile({ ...auth.user });
    const fresh = await findProfileByUserId(auth.user.id);
    if (fresh?.$id) {
      await databases.updateDocument(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, fresh.$id, {
        avatar: avatarUrl,
        updatedAt: now,
      });

      writeProfileCache(
        mapProfile(
          {
            ...fresh,
            avatar: avatarUrl,
            updatedAt: now,
          },
          {
            userId: auth.user.id,
            email: auth.user.email,
            name: auth.user.name,
          }
        )
      );
    }
  }

  return avatarUrl;
}

export async function updateProfileName(name: string) {
  ensureDbReady();
  const auth = await getCurrentAuthUser();
  if (!auth.ok || !auth.user) throw new Error("Please sign in.");

  const payload = {
    name: name.trim(),
    updatedAt: new Date().toISOString(),
  };

  const existing = await findProfileByUserId(auth.user.id);
  if (existing?.$id) {
    await databases.updateDocument(appwriteEnv.databaseId, appwriteEnv.usersCollectionId, existing.$id, payload);

    writeProfileCache(
      mapProfile(
        {
          ...existing,
          name: payload.name,
          updatedAt: payload.updatedAt,
        },
        {
          userId: auth.user.id,
          email: auth.user.email,
          name: auth.user.name,
        }
      )
    );
  } else {
    const created = await createDefaultProfile({ ...auth.user, name });
    writeProfileCache(created);
  }

  return payload;
}
