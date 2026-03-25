import { databases } from "../appwrite";
import { appwriteEnv } from "./env";

export type PlatformConfig = {
  bkashNumber: string;
  proPrice: number;
  threeMonthPrice: number;
  annualPrice: number;
  supportEmail: string;
};

export const DEFAULT_CONFIG: PlatformConfig = {
  bkashNumber: "01XXXXXXXXX",
  proPrice: 199,
  threeMonthPrice: 499,
  annualPrice: 1799,
  supportEmail: "support@habitwallet.app",
};

// We assume there's a collection 'platform_config' with a document ID 'global'
// For production, create a collection named 'platform_config' with a String attribute 'data'
const CONFIG_DOC_ID = "global";

export async function fetchPlatformConfig(): Promise<PlatformConfig> {
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_PLATFORM_CONFIG_COLLECTION_ID || "platform_config";
  
  if (!appwriteEnv.databaseId) return DEFAULT_CONFIG;

  try {
    const doc = await databases.getDocument(
      appwriteEnv.databaseId,
      collectionId,
      CONFIG_DOC_ID
    );
    
    // Parse the JSON data safely
    if (doc.data) {
      const parsed = JSON.parse(doc.data as string);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
    return DEFAULT_CONFIG;
  } catch (error: unknown) {
    // If collection/document doesn't exist, return default safely
    console.warn("Could not fetch platform config:", error instanceof Error ? error.message : "Unknown error");
    return DEFAULT_CONFIG;
  }
}

export async function updatePlatformConfig(config: PlatformConfig) {
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_PLATFORM_CONFIG_COLLECTION_ID || "platform_config";
  
  if (!appwriteEnv.databaseId) throw new Error("Database not configured");

  try {
    // Try to update existing
    await databases.updateDocument(
      appwriteEnv.databaseId,
      collectionId,
      CONFIG_DOC_ID,
      { data: JSON.stringify(config) }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === 404) {
      // Create if it doesn't exist
      await databases.createDocument(
        appwriteEnv.databaseId,
        collectionId,
        CONFIG_DOC_ID,
        { data: JSON.stringify(config) }
      );
    } else {
      throw error;
    }
  }
}
