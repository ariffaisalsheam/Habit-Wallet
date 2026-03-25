import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ProgressPoint = {
  label: string;
  completed: number;
  total: number;
};

type MonthlyFinancials = {
  income: number;
  expense: number;
};

type InsightsExportPayload = {
  windowDays: 7 | 30 | 90;
  completionRate: number;
  previousCompletionRate: number;
  savingsRate: number;
  previousSavingsRate: number;
  spendingDeltaPercent: number;
  topExpenseLabel: string;
  progressPoints: ProgressPoint[];
  monthlyFinancials: MonthlyFinancials;
  monthlyBalance: number;
  topExpenseCategories: Array<[string, number]>;
};

const currencyFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 2,
});

function formatDelta(current: number, previous: number, suffix = "%") {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}${suffix}`;
}

export function exportInsightsPdf(payload: InsightsExportPayload) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.text("HabitWallet - Insights Report", 40, 40);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, 40, 58);
  doc.text(`Window: Last ${payload.windowDays} days`, 40, 74);

  autoTable(doc, {
    startY: 90,
    head: [["Metric", "Value"]],
    body: [
      ["Habit consistency", `${payload.completionRate}% (${formatDelta(payload.completionRate, payload.previousCompletionRate)} vs prev)`],
      ["Monthly savings rate", `${payload.savingsRate}% (${formatDelta(payload.savingsRate, payload.previousSavingsRate)} vs prev)`],
      ["Spending delta", `${payload.spendingDeltaPercent > 0 ? "+" : ""}${payload.spendingDeltaPercent}% vs previous window`],
      ["Top expense focus", payload.topExpenseLabel],
      ["Monthly income", currencyFormatter.format(payload.monthlyFinancials.income)],
      ["Monthly expense", currencyFormatter.format(payload.monthlyFinancials.expense)],
      ["Monthly balance", currencyFormatter.format(payload.monthlyBalance)],
    ],
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [31, 107, 74],
    },
  });

  autoTable(doc, {
    startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16
      : 280,
    head: [["Rhythm", "Completed", "Total", "Rate"]],
    body: payload.progressPoints.map((point) => {
      const rate = point.total ? Math.round((point.completed / point.total) * 100) : 0;

      return [point.label, String(point.completed), String(point.total), `${rate}%`];
    }),
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [86, 126, 98],
    },
  });

  autoTable(doc, {
    startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16
      : 420,
    head: [["Top expense categories", "Amount"]],
    body:
      payload.topExpenseCategories.length > 0
        ? payload.topExpenseCategories.map(([category, amount]) => [category, currencyFormatter.format(amount)])
        : [["No expense data", "-"]],
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [124, 161, 134],
    },
  });

  doc.save(`hft-insights-${new Date().toISOString().slice(0, 10)}.pdf`);
}
