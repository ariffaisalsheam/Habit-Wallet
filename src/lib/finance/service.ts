import { ID } from "appwrite";
import { createDatabases, q } from "@/lib/appwrite/databases";
import { getCurrentAuthUser } from "@/lib/auth/service";
import { appwriteEnv, hasCollectionsConfig, hasDatabaseConfig } from "@/lib/config/env";
import type {
  FinanceTransaction,
  MonthlyBudget,
  MonthlyBudgetInput,
  TransactionInput,
} from "@/features/finance/types";

type TransactionDocument = {
  $id: string;
  userId: string;
  type: FinanceTransaction["type"];
  category: string;
  amount: number;
  currency: "BDT";
  date: string;
  description: string;
  created_at: string;
  synced?: boolean;
};

type BudgetDocument = {
  $id: string;
  userId: string;
  monthYear: string;
  category: string;
  limitAmount: number;
  updatedAt: string;
};

function ensureDbReady() {
  if (!hasDatabaseConfig() || !hasCollectionsConfig()) {
    throw new Error("Missing Appwrite database configuration for finance sync.");
  }
}

async function requireAuthUser() {
  const auth = await getCurrentAuthUser();
  if (!auth.ok || !auth.user) {
    throw new Error(auth.message ?? "Please sign in to sync finance data.");
  }
  return auth.user;
}

function mapTransaction(document: TransactionDocument): FinanceTransaction {
  return {
    id: document.$id,
    type: document.type,
    category: document.category,
    amount: Number(document.amount),
    currency: "BDT",
    date: document.date,
    description: document.description ?? "",
    created_at: document.created_at,
    synced: document.synced ?? true,
  };
}

function mapBudget(document: BudgetDocument): MonthlyBudget {
  return {
    id: document.$id,
    monthYear: document.monthYear,
    category: document.category,
    limitAmount: Number(document.limitAmount),
    updatedAt: document.updatedAt,
  };
}

export async function loadTransactionsRemote() {
  ensureDbReady();
  const user = await requireAuthUser();

  const response = await createDatabases().listDocuments(
    appwriteEnv.databaseId,
    appwriteEnv.transactionsCollectionId,
    [q.equal("userId", user.id), q.orderDesc("date"), q.limit(2000)]
  );

  return response.documents.map((item) => mapTransaction(item as unknown as TransactionDocument));
}

export async function createTransactionRemote(input: TransactionInput) {
  ensureDbReady();
  const user = await requireAuthUser();

  const document = (await createDatabases().createDocument(
    appwriteEnv.databaseId,
    appwriteEnv.transactionsCollectionId,
    ID.unique(),
    {
      userId: user.id,
      type: input.type,
      category: input.category.trim(),
      amount: Number(input.amount),
      currency: "BDT",
      date: input.date,
      description: input.description.trim(),
      created_at: new Date().toISOString(),
      synced: true,
    }
  )) as unknown as TransactionDocument;

  return mapTransaction(document);
}

export async function updateTransactionRemote(id: string, input: TransactionInput) {
  ensureDbReady();

  const document = (await createDatabases().updateDocument(
    appwriteEnv.databaseId,
    appwriteEnv.transactionsCollectionId,
    id,
    {
      type: input.type,
      category: input.category.trim(),
      amount: Number(input.amount),
      date: input.date,
      description: input.description.trim(),
      synced: true,
    }
  )) as unknown as TransactionDocument;

  return mapTransaction(document);
}

export async function deleteTransactionRemote(id: string) {
  ensureDbReady();
  await createDatabases().deleteDocument(appwriteEnv.databaseId, appwriteEnv.transactionsCollectionId, id);
}

export async function loadBudgetsRemote(monthYear?: string) {
  ensureDbReady();
  const user = await requireAuthUser();

  const queries = [q.equal("userId", user.id), q.orderDesc("updatedAt"), q.limit(500)];
  if (monthYear) {
    queries.push(q.equal("monthYear", monthYear));
  }

  const response = await createDatabases().listDocuments(
    appwriteEnv.databaseId,
    appwriteEnv.budgetsCollectionId,
    queries
  );

  return response.documents.map((item) => mapBudget(item as unknown as BudgetDocument));
}

export async function upsertBudgetRemote(input: MonthlyBudgetInput) {
  ensureDbReady();
  const user = await requireAuthUser();
  const databases = createDatabases();

  const normalizedCategory = input.category.trim();
  const existing = await databases.listDocuments(
    appwriteEnv.databaseId,
    appwriteEnv.budgetsCollectionId,
    [
      q.equal("userId", user.id),
      q.equal("monthYear", input.monthYear),
      q.equal("category", normalizedCategory),
      q.limit(1),
    ]
  );

  const updatedAt = new Date().toISOString();

  if (existing.documents.length > 0) {
    const document = (await databases.updateDocument(
      appwriteEnv.databaseId,
      appwriteEnv.budgetsCollectionId,
      existing.documents[0].$id,
      {
        limitAmount: Number(input.limitAmount),
        updatedAt,
      }
    )) as unknown as BudgetDocument;

    return mapBudget(document);
  }

  const created = (await databases.createDocument(
    appwriteEnv.databaseId,
    appwriteEnv.budgetsCollectionId,
    ID.unique(),
    {
      userId: user.id,
      monthYear: input.monthYear,
      category: normalizedCategory,
      limitAmount: Number(input.limitAmount),
      updatedAt,
    }
  )) as unknown as BudgetDocument;

  return mapBudget(created);
}

export async function deleteBudgetRemote(id: string) {
  ensureDbReady();
  await createDatabases().deleteDocument(appwriteEnv.databaseId, appwriteEnv.budgetsCollectionId, id);
}
