import { ID } from "appwrite";
import { createDatabases, q } from "@/lib/appwrite/databases";
import { getCurrentAuthUser } from "@/lib/auth/service";
import { appwriteEnv, hasCollectionsConfig, hasDatabaseConfig } from "@/lib/config/env";
import type { HabitCompletion, HabitInput, HabitItem } from "@/features/habits/types";

type HabitDocument = {
  $id: string;
  userId: string;
  title: string;
  category: string;
  color: string;
  frequency: HabitItem["frequency"];
  timeBlock: HabitItem["timeBlock"];
  targetDaysPerWeek: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type HabitCompletionDocument = {
  $id: string;
  habitId: string;
  userId: string;
  completionDate: string;
  completedAt: string;
  notes?: string;
  synced?: boolean;
};

function ensureDbReady() {
  if (!hasDatabaseConfig() || !hasCollectionsConfig()) {
    throw new Error("Missing Appwrite database configuration for habit sync.");
  }
}

async function requireAuthUser() {
  const auth = await getCurrentAuthUser();
  if (!auth.ok || !auth.user) {
    throw new Error(auth.message ?? "Please sign in to sync habits.");
  }
  return auth.user;
}

function mapHabit(document: HabitDocument): HabitItem {
  return {
    id: document.$id,
    title: document.title,
    category: document.category,
    color: document.color,
    frequency: document.frequency,
    timeBlock: document.timeBlock ?? "morning",
    targetDaysPerWeek: Number(document.targetDaysPerWeek ?? 7),
    isActive: Boolean(document.isActive),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function mapCompletion(document: HabitCompletionDocument): HabitCompletion {
  return {
    id: document.$id,
    habitId: document.habitId,
    completionDate: document.completionDate,
    completedAt: document.completedAt,
    notes: document.notes ?? "",
    synced: document.synced ?? true,
  };
}

export async function loadHabitsBundle() {
  ensureDbReady();
  const user = await requireAuthUser();
  const databases = createDatabases();

  const [habitsResponse, completionsResponse] = await Promise.all([
    databases.listDocuments(appwriteEnv.databaseId, appwriteEnv.habitsCollectionId, [
      q.equal("userId", user.id),
      q.orderDesc("updatedAt"),
      q.limit(500),
    ]),
    databases.listDocuments(appwriteEnv.databaseId, appwriteEnv.habitCompletionsCollectionId, [
      q.equal("userId", user.id),
      q.orderDesc("completedAt"),
      q.limit(2000),
    ]),
  ]);

  return {
    habits: habitsResponse.documents.map((item) => mapHabit(item as unknown as HabitDocument)),
    completions: completionsResponse.documents.map((item) =>
      mapCompletion(item as unknown as HabitCompletionDocument)
    ),
  };
}

export async function createHabitRemote(input: HabitInput) {
  ensureDbReady();
  const user = await requireAuthUser();
  const now = new Date().toISOString();

  const document = (await createDatabases().createDocument(
    appwriteEnv.databaseId,
    appwriteEnv.habitsCollectionId,
    ID.unique(),
    {
      userId: user.id,
      title: input.title.trim(),
      category: input.category.trim(),
      color: input.color,
      frequency: input.frequency,
      timeBlock: input.timeBlock,
      targetDaysPerWeek: Number(input.targetDaysPerWeek),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
  )) as unknown as HabitDocument;

  return mapHabit(document);
}

export async function updateHabitRemote(id: string, input: HabitInput) {
  ensureDbReady();

  const document = (await createDatabases().updateDocument(
    appwriteEnv.databaseId,
    appwriteEnv.habitsCollectionId,
    id,
    {
      title: input.title.trim(),
      category: input.category.trim(),
      color: input.color,
      frequency: input.frequency,
      timeBlock: input.timeBlock,
      targetDaysPerWeek: Number(input.targetDaysPerWeek),
      updatedAt: new Date().toISOString(),
    }
  )) as unknown as HabitDocument;

  return mapHabit(document);
}

export async function removeHabitRemote(id: string) {
  ensureDbReady();
  const databases = createDatabases();

  const completions = await databases.listDocuments(
    appwriteEnv.databaseId,
    appwriteEnv.habitCompletionsCollectionId,
    [q.equal("habitId", id), q.limit(500)]
  );

  await Promise.all([
    ...completions.documents.map((item) =>
      databases.deleteDocument(
        appwriteEnv.databaseId,
        appwriteEnv.habitCompletionsCollectionId,
        item.$id
      )
    ),
    databases.deleteDocument(appwriteEnv.databaseId, appwriteEnv.habitsCollectionId, id),
  ]);
}

export async function toggleHabitCompletionRemote(habitId: string, date: string) {
  ensureDbReady();
  const user = await requireAuthUser();
  const databases = createDatabases();

  const existing = await databases.listDocuments(
    appwriteEnv.databaseId,
    appwriteEnv.habitCompletionsCollectionId,
    [q.equal("habitId", habitId), q.equal("completionDate", date), q.limit(1)]
  );

  if (existing.documents.length > 0) {
    await databases.deleteDocument(
      appwriteEnv.databaseId,
      appwriteEnv.habitCompletionsCollectionId,
      existing.documents[0].$id
    );
    return null;
  }

  const completion = (await databases.createDocument(
    appwriteEnv.databaseId,
    appwriteEnv.habitCompletionsCollectionId,
    ID.unique(),
    {
      userId: user.id,
      habitId,
      completionDate: date,
      completedAt: new Date().toISOString(),
      notes: "",
      synced: true,
    }
  )) as unknown as HabitCompletionDocument;

  return mapCompletion(completion);
}
