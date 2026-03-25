import { Client } from "appwrite";
import { appwriteEnv, hasAppwriteConfig } from "@/lib/config/env";

export function createAppwriteClient() {
  if (!hasAppwriteConfig()) {
    throw new Error(
      "Missing Appwrite environment variables. Check NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID."
    );
  }

  return new Client()
    .setEndpoint(appwriteEnv.endpoint)
    .setProject(appwriteEnv.projectId);
}
