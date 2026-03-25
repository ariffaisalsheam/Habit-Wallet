import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { FinanceTransaction } from "@/features/finance/types";

const bdtFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatBDT(amount: number) {
  return bdtFormatter.format(amount);
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function getCurrentMonthTotals(transactions: FinanceTransaction[]) {
  const monthPrefix = new Date().toISOString().slice(0, 7);

  return transactions.reduce(
    (acc, transaction) => {
      if (!transaction.date.startsWith(monthPrefix)) {
        return acc;
      }

      if (transaction.type === "income") {
        acc.income += transaction.amount;
      } else {
        acc.expense += transaction.amount;
      }

      return acc;
    },
    { income: 0, expense: 0 }
  );
}

export function exportTransactionsPdf(transactions: FinanceTransaction[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.text("HabitWallet - Transactions Report", 40, 40);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, 40, 58);

  const totals = getCurrentMonthTotals(transactions);
  doc.text(
    `Current Month -> Income: ${formatBDT(totals.income)} | Expense: ${formatBDT(totals.expense)} | Balance: ${formatBDT(totals.income - totals.expense)}`,
    40,
    74
  );

  autoTable(doc, {
    startY: 90,
    head: [["Date", "Type", "Category", "Amount", "Currency", "Description"]],
    body: transactions.map((transaction) => [
      formatDate(transaction.date),
      transaction.type,
      transaction.category,
      transaction.amount.toFixed(2),
      transaction.currency,
      transaction.description || "-",
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [31, 107, 74],
    },
  });

  doc.save(`hft-transactions-${new Date().toISOString().slice(0, 10)}.pdf`);
}
