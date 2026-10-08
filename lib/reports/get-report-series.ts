import { OrderPaymentStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveOrderSkuMargin } from "@/lib/reports/order-margin";
import { dateKeyFromDate, eachDateKey, type ReportPeriod } from "@/lib/reports/report-period";
import { formatChartDayLabel } from "@/lib/reports/report-format";
import type { ReportDailyPoint } from "@/lib/reports/report-types";

function resolvePaidAt(paidAt: Date | null, fallback: Date): Date {
  return paidAt ?? fallback;
}

export async function getReportDailySeries(period: ReportPeriod): Promise<ReportDailyPoint[]> {
  const { from, to } = period;
  const keys = eachDateKey(from, to);
  const map = new Map<string, ReportDailyPoint>();
  for (const key of keys) {
    map.set(key, {
      date: key,
      label: formatChartDayLabel(key),
      orderOmzet: 0,
      orderMargin: 0,
      expense: 0,
      orderCount: 0,
    });
  }

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        paymentStatus: OrderPaymentStatus.PAID,
        payments: {
          some: {
            status: OrderPaymentStatus.PAID,
            OR: [
              { paidAt: { gte: from, lte: to } },
              { AND: [{ paidAt: null }, { updatedAt: { gte: from, lte: to } }] },
            ],
          },
        },
      },
      select: {
        amount: true,
        memberId: true,
        updatedAt: true,
        productSku: {
          select: { marginGuest: true, marginMember: true },
        },
        payments: {
          where: { status: OrderPaymentStatus.PAID },
          orderBy: { paidAt: "desc" },
          take: 1,
          select: { paidAt: true, updatedAt: true },
        },
      },
    }),
    prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      select: { date: true, amount: true },
    }),
  ]);

  for (const order of orders) {
    const pay = order.payments[0];
    const paidAt = resolvePaidAt(pay?.paidAt ?? null, pay?.updatedAt ?? order.updatedAt);
    const key = dateKeyFromDate(paidAt);
    const point = map.get(key);
    if (!point) continue;
    point.orderOmzet += order.amount;
    point.orderMargin += resolveOrderSkuMargin(order);
    point.orderCount += 1;
  }

  for (const expense of expenses) {
    const key = dateKeyFromDate(expense.date);
    const point = map.get(key);
    if (!point) continue;
    point.expense += expense.amount;
  }

  return keys.map((key) => map.get(key)!);
}
