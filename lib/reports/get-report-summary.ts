import { OrderPaymentStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sumOrderSkuMargins } from "@/lib/reports/order-margin";
import type { ReportPeriod } from "@/lib/reports/report-period";
import type { ReportSummary } from "@/lib/reports/report-types";
import { EXPENSE_CATEGORY_LABEL, type ExpenseCategoryValue } from "@/lib/reports/expense-labels";

function paidAtWindow(from: Date, to: Date) {
  return {
    some: {
      status: OrderPaymentStatus.PAID,
      OR: [
        { paidAt: { gte: from, lte: to } },
        { AND: [{ paidAt: null }, { updatedAt: { gte: from, lte: to } }] },
      ],
    },
  };
}

export async function getReportSummary(period: ReportPeriod): Promise<ReportSummary> {
  const { from, to } = period;

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        paymentStatus: OrderPaymentStatus.PAID,
        payments: paidAtWindow(from, to),
      },
      select: {
        amount: true,
        memberId: true,
        productSku: {
          select: { marginGuest: true, marginMember: true },
        },
      },
    }),
    prisma.expense.findMany({
      where: {
        date: { gte: from, lte: to },
      },
      select: { amount: true, category: true },
    }),
  ]);

  const orderOmzet = orders.reduce((sum, row) => sum + row.amount, 0);
  const orderMarginTotal = sumOrderSkuMargins(orders);
  const expenseTotal = expenses.reduce((sum, row) => sum + row.amount, 0);

  const byCat = new Map<string, number>();
  for (const row of expenses) {
    byCat.set(row.category, (byCat.get(row.category) ?? 0) + row.amount);
  }

  const expenseByCategory = [...byCat.entries()]
    .map(([category, amount]) => ({
      category: EXPENSE_CATEGORY_LABEL[category as ExpenseCategoryValue] ?? category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    orderOmzet,
    orderMarginTotal,
    orderCount: orders.length,
    expenseTotal,
    expenseCount: expenses.length,
    netProfit: orderMarginTotal - expenseTotal,
    expenseByCategory,
  };
}
