export const appwriteEnv = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://habitwallet.afsbd.tech",
  usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? "users",
  subscriptionsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID ?? "subscriptions",
  adminLogsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ADMIN_LOGS_COLLECTION_ID ?? "admin_logs",
  habitsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_HABITS_COLLECTION_ID ?? "habits",
  habitCompletionsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_HABIT_COMPLETIONS_COLLECTION_ID ?? "habit_completions",
  transactionsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID ?? "transactions",
  budgetsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_BUDGETS_COLLECTION_ID ?? "budgets",
  avatarsBucketId: process.env.NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID ?? "avatars",
};

export function hasAppwriteConfig() {
  return Boolean(appwriteEnv.endpoint && appwriteEnv.projectId);
}

export function hasDatabaseConfig() {
  return Boolean(appwriteEnv.databaseId);
}

export function hasCollectionsConfig() {
  return Boolean(
    appwriteEnv.usersCollectionId &&
      appwriteEnv.subscriptionsCollectionId &&
      appwriteEnv.adminLogsCollectionId &&
      appwriteEnv.habitsCollectionId &&
      appwriteEnv.habitCompletionsCollectionId &&
      appwriteEnv.transactionsCollectionId &&
      appwriteEnv.budgetsCollectionId
  );
}

export function getAppBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return appwriteEnv.siteUrl;
}
