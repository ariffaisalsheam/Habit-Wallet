export type TransactionType = "income" | "expense";

export type FinanceTransaction = {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency: "BDT";
  date: string;
  description: string;
  created_at: string;
  synced: boolean;
};

export type TransactionInput = {
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description: string;
};

export type MonthlyBudget = {
  id: string;
  monthYear: string;
  category: string;
  limitAmount: number;
  updatedAt: string;
};

export type MonthlyBudgetInput = {
  monthYear: string;
  category: string;
  limitAmount: number;
};
