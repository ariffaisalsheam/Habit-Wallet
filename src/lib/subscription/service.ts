import { ID } from "appwrite";
import { createDatabases, q } from "@/lib/appwrite/databases";
import { getCurrentAuthUser, userHasAdminLabel } from "@/lib/auth/service";
import { appwriteEnv, hasCollectionsConfig, hasDatabaseConfig } from "@/lib/config/env";
import { upsertSubscriptionTier } from "@/lib/profile/service";
import type {
  SubscriptionPaymentStatus,
  SubscriptionRequest,
  SubscriptionRequestInput,
} from "@/features/subscription/types";

type SubscriptionDocument = {
  $id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tier: "pro";
  amount: number;
  months: number;
  method: "bkash";
  senderNumber: string;
  transactionId: string;
  status: SubscriptionPaymentStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
};

function ensureDbReady() {
  if (!hasDatabaseConfig() || !hasCollectionsConfig()) {
    throw new Error("Missing Appwrite database configuration for subscription backend.");
  }
}

function mapRequest(document: SubscriptionDocument): SubscriptionRequest {
  return {
    id: document.$id,
    userId: document.userId,
    userName: document.userName,
    userEmail: document.userEmail,
    tier: "pro",
    amount: Number(document.amount),
    months: Number(document.months),
    method: "bkash",
    senderNumber: document.senderNumber,
    transactionId: document.transactionId,
    status: document.status,
    submittedAt: document.submittedAt,
    reviewedAt: document.reviewedAt,
    reviewedBy: document.reviewedBy,
    adminNote: document.adminNote,
  };
}

async function requireAdmin() {
  const auth = await getCurrentAuthUser();

  if (!auth.ok || !auth.user) {
    throw new Error(auth.message ?? "Please sign in as admin.");
  }

  if (!userHasAdminLabel(auth.user.labels)) {
    throw new Error("Admin access is required for this action.");
  }

  return auth.user;
}

export async function submitSubscriptionRequest(input: SubscriptionRequestInput) {
  ensureDbReady();

  const auth = await getCurrentAuthUser();
  if (!auth.ok || !auth.user) {
    throw new Error(auth.message ?? "Please sign in to submit a request.");
  }

  const transactionId = input.transactionId.trim();
  const databases = createDatabases();

  const existing = await databases.listDocuments(
    appwriteEnv.databaseId,
    appwriteEnv.subscriptionsCollectionId,
    [q.equal("transactionId", transactionId), q.limit(1)]
  );

  if (existing.documents.length > 0) {
    throw new Error("A subscription request with this transaction ID already exists.");
  }

  const submittedAt = new Date().toISOString();

  const document = (await databases.createDocument(
    appwriteEnv.databaseId,
    appwriteEnv.subscriptionsCollectionId,
    ID.unique(),
    {
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      tier: "pro",
      amount: Number(input.amount),
      months: Number(input.months),
      method: "bkash",
      senderNumber: input.senderNumber.trim(),
      transactionId,
      status: "pending",
      submittedAt,
    }
  )) as unknown as SubscriptionDocument;

  return mapRequest(document);
}

export async function listMySubscriptionRequests() {
  ensureDbReady();

  const auth = await getCurrentAuthUser();
  if (!auth.ok || !auth.user) {
    throw new Error(auth.message ?? "Please sign in to view your requests.");
  }

  const databases = createDatabases();
  const response = await databases.listDocuments(
    appwriteEnv.databaseId,
    appwriteEnv.subscriptionsCollectionId,
    [q.equal("userId", auth.user.id), q.orderDesc("submittedAt")]
  );

  return response.documents.map((item) => mapRequest(item as unknown as SubscriptionDocument));
}

export async function listAllSubscriptionRequestsForAdmin() {
  ensureDbReady();
  await requireAdmin();

  const databases = createDatabases();
  const response = await databases.listDocuments(
    appwriteEnv.databaseId,
    appwriteEnv.subscriptionsCollectionId,
    [q.orderDesc("submittedAt"), q.limit(200)]
  );

  return response.documents.map((item) => mapRequest(item as unknown as SubscriptionDocument));
}

export async function reviewSubscriptionRequest(
  requestId: string,
  status: Exclude<SubscriptionPaymentStatus, "pending">,
  adminNote: string
) {
  ensureDbReady();
  const admin = await requireAdmin();

  const databases = createDatabases();
  const reviewedAt = new Date().toISOString();

  const updated = (await databases.updateDocument(
    appwriteEnv.databaseId,
    appwriteEnv.subscriptionsCollectionId,
    requestId,
    {
      status,
      adminNote: adminNote.trim(),
      reviewedBy: admin.name || admin.email,
      reviewedAt,
    }
  )) as unknown as SubscriptionDocument;

  if (status === "approved") {
    const start = new Date(reviewedAt);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(updated.months));

    await upsertSubscriptionTier(updated.userId, "pro", end.toISOString().slice(0, 10));
  }

  if (status === "rejected") {
    await upsertSubscriptionTier(updated.userId, "free", null);
  }

  await databases.createDocument(appwriteEnv.databaseId, appwriteEnv.adminLogsCollectionId, ID.unique(), {
    adminId: admin.id,
    action: status === "approved" ? "subscription_approved" : "subscription_rejected",
    resourceType: "subscription",
    resourceId: requestId,
    notes: adminNote.trim(),
    createdAt: reviewedAt,
  });

  return mapRequest(updated);
}

export async function cancelUserPlanByAdmin(userId: string, adminNote = "") {
  ensureDbReady();
  const admin = await requireAdmin();

  const reviewedAt = new Date().toISOString();
  const databases = createDatabases();

  await upsertSubscriptionTier(userId, "free", null);

  await databases.createDocument(appwriteEnv.databaseId, appwriteEnv.adminLogsCollectionId, ID.unique(), {
    adminId: admin.id,
    action: "subscription_cancelled",
    resourceType: "user_profile",
    resourceId: userId,
    notes: adminNote.trim() || "Plan manually cancelled from admin users panel.",
    createdAt: reviewedAt,
  });

  return {
    userId,
    cancelledAt: reviewedAt,
  };
}
