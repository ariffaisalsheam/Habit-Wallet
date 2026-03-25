import { Databases, Query } from "appwrite";
import { createAppwriteClient } from "@/lib/appwrite/client";
import { appwriteEnv, hasDatabaseConfig } from "@/lib/config/env";

export function createDatabases() {
  if (!hasDatabaseConfig()) {
    throw new Error("Missing NEXT_PUBLIC_APPWRITE_DATABASE_ID in environment variables.");
  }

  return new Databases(createAppwriteClient());
}

export function appwriteCollectionPath(collectionId: string) {
  return {
    databaseId: appwriteEnv.databaseId,
    collectionId,
  };
}

export const q = Query;
