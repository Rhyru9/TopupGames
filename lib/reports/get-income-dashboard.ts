import { OrderPaymentStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReportKpiMetric } from "@/lib/reports/get-report-dashboard";
import { calcReportDelta, resolvePreviousPeriod } from "@/lib/reports/report-compare";
import { getReportDailySeries } from "@/lib/reports/get-report-series";
import { getReportSummary } from "@/lib/reports/get-report-summary";
import type { ReportPeriod } from "@/lib/reports/report-period";
import type { ReportDailyPoint } from "@/lib/reports/report-types";

export type IncomeChannelSlice = {
  name: string;
  value: number;
  count: number;
  color: string;
};

export type IncomeBuyerSlice = {
  name: string;
  value: number;
  count: number;
  color: string;
};

export type IncomeDashboardData = {
  period: ReportPeriod;
  series: ReportDailyPoint[];
  kpis: ReportKpiMetric[];
  channelMix: IncomeChannelSlice[];
  buyerMix: IncomeBuyerSlice[];
  topChannels: IncomeChannelSlice[];
};

const CHANNEL_COLORS = ["#4ecdc4", "#ff7a1a", "#b197fc", "#ffa94d", "#ff6b9d", "#9a9a9a"];

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

export async function getIncomeDashboard(period: ReportPeriod): Promise<IncomeDashboardData> {
  const previousPeriod = resolvePreviousPeriod(period);

  const [summary, previousSummary, series, orders] = await Promise.all([
    getReportSummary(period),
    getReportSummary(previousPeriod),
    getReportDailySeries(period),
    prisma.order.findMany({
      where: {
        paymentStatus: OrderPaymentStatus.PAID,
        payments: paidAtWindow(period.from, period.to),
      },
      select: {
        amount: true,
        memberId: true,
        productSku: {
          select: { marginGuest: true, marginMember: true },
        },
        payments: {
          where: { status: OrderPaymentStatus.PAID },
          orderBy: { paidAt: "desc" },
          take: 1,
          select: { channelName: true, channel: true },
        },
      },
    }),
  ]);

  const avgTicket = summary.orderCount > 0 ? Math.round(summary.orderOmzet / summary.orderCount) : 0;
  const prevAvgTicket =
    previousSummary.orderCount > 0
      ? Math.round(previousSummary.orderOmzet / previousSummary.orderCount)
      : 0;

  const kpis: ReportKpiMetric[] = [
    {
      key: "omzet",
      label: "Nilai transaksi",
      value: summary.orderOmzet,
      delta: calcReportDelta(summary.orderOmzet, previousSummary.orderOmzet),
      sparkline: series.map((point) => point.orderOmzet),
      tone: "cyan",
    },
    {
      key: "margin",
      label: "Margin SKU",
      value: summary.orderMarginTotal,
      delta: calcReportDelta(summary.orderMarginTotal, previousSummary.orderMarginTotal),
      sparkline: series.map((point) => point.orderMargin),
      tone: "neon",
    },
    {
      key: "orders",
      label: "Order PAID",
      value: summary.orderCount,
      delta: calcReportDelta(summary.orderCount, previousSummary.orderCount),
      sparkline: series.map((point) => point.orderCount),
      tone: "violet",
      format: "count",
    },
    {
      key: "avg",
      label: "Rata-rata order",
      value: avgTicket,
      delta: calcReportDelta(avgTicket, prevAvgTicket),
      sparkline: series.map((point) =>
        point.orderCount > 0 ? Math.round(point.orderOmzet / point.orderCount) : 0,
      ),
      tone: "orange",
    },
  ];

  const channelMap = new Map<string, { value: number; count: number }>();
  let guestOmzet = 0;
  let memberOmzet = 0;
  let guestCount = 0;
  let memberCount = 0;

  for (const order of orders) {
    const pay = order.payments[0];
    const channel = (pay?.channelName || pay?.channel || "Lainnya").trim() || "Lainnya";
    const current = channelMap.get(channel) ?? { value: 0, count: 0 };
    current.value += order.amount;
    current.count += 1;
    channelMap.set(channel, current);

    if (order.memberId) {
      memberOmzet += order.amount;
      memberCount += 1;
    } else {
      guestOmzet += order.amount;
      guestCount += 1;
    }
  }

  const channelMix = [...channelMap.entries()]
    .map(([name, item], index) => ({
      name,
      value: item.value,
      count: item.count,
      color: CHANNEL_COLORS[index % CHANNEL_COLORS.length]!,
    }))
    .sort((a, b) => b.value - a.value);

  const buyerMix: IncomeBuyerSlice[] = [
    { name: "Guest", value: guestOmzet, count: guestCount, color: "#ffa94d" },
    { name: "Member", value: memberOmzet, count: memberCount, color: "#4ecdc4" },
  ].filter((item) => item.value > 0 || item.count > 0);

  return {
    period,
    series,
    kpis,
    channelMix: channelMix.length
      ? channelMix
      : [{ name: "Belum ada data", value: 1, count: 0, color: "#2a2a2a" }],
    buyerMix: buyerMix.length
      ? buyerMix
      : [{ name: "Belum ada data", value: 1, count: 0, color: "#2a2a2a" }],
    topChannels: channelMix.slice(0, 5),
  };
}
