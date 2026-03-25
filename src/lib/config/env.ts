export const appwriteEnv = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "",
};

export function hasAppwriteConfig() {
  return Boolean(appwriteEnv.endpoint && appwriteEnv.projectId);
}
