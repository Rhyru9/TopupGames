export type ReportSummary = {
  orderOmzet: number;
  orderMarginTotal: number;
  orderCount: number;
  expenseTotal: number;
  expenseCount: number;
  netProfit: number;
  expenseByCategory: { category: string; amount: number }[];
};

export type ReportDailyPoint = {
  date: string;
  label: string;
  orderOmzet: number;
  orderMargin: number;
  expense: number;
  orderCount: number;
};

export type ReportIncomeRow = {
  id: string;
  code: string;
  paidAt: Date;
  amount: number;
  channel: string | null;
  href: string;
};

export type ExpenseListItem = {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  receiptUrl: string | null;
  createdByName: string | null;
  updatedAt: Date;
};
