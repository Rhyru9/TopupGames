import { OrderPaymentStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReportPeriod } from "@/lib/reports/report-period";
import type { ReportIncomeRow } from "@/lib/reports/report-types";

function resolvePaidAt(paidAt: Date | null, fallback: Date): Date {
  return paidAt ?? fallback;
}

export async function getReportIncomeRows(options: {
  period: ReportPeriod;
  skip?: number;
  take?: number;
}): Promise<{ items: ReportIncomeRow[]; total: number }> {
  const { period, skip = 0, take = 50 } = options;
  const { from, to } = period;

  const orders = await prisma.order.findMany({
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
      id: true,
      orderCode: true,
      amount: true,
      updatedAt: true,
      payments: {
        where: { status: OrderPaymentStatus.PAID },
        orderBy: { paidAt: "desc" },
        take: 1,
        select: { paidAt: true, updatedAt: true, channelName: true, channel: true },
      },
    },
  });

  const rows: ReportIncomeRow[] = orders.map((order) => {
    const pay = order.payments[0];
    return {
      id: order.id,
      code: order.orderCode,
      paidAt: resolvePaidAt(pay?.paidAt ?? null, pay?.updatedAt ?? order.updatedAt),
      amount: order.amount,
      channel: pay?.channelName || pay?.channel || null,
      href: `/console/orders/${order.id}`,
    };
  });

  rows.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
  const total = rows.length;
  const items = rows.slice(skip, skip + take);
  return { items, total };
}
