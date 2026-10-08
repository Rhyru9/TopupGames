import {
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  Prisma,
} from "@/app/generated/prisma/client";
import { getCatalogStats } from "@/lib/catalog-stats";
import { prisma } from "@/lib/prisma";
import { getReportSummary } from "@/lib/reports/get-report-summary";
import type { ReportPeriod } from "@/lib/reports/report-period";

export type DashboardOrderSummary = {
  amount: number;
  count: number;
};

export type DashboardRecentOrder = {
  id: string;
  orderCode: string;
  productNameSnapshot: string;
  skuNameSnapshot: string;
  amount: number;
  playerLabel: string | null;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  createdAt: Date;
};

export type ConsoleDashboardData = {
  year: number;
  summary: {
    totalUsers: number;
    totalProducts: number;
    totalProductSkus: number;
    netProfitYear: number;
  };
  ordersAllTime: {
    success: DashboardOrderSummary;
    pending: DashboardOrderSummary;
    failed: DashboardOrderSummary;
    topup: DashboardOrderSummary;
  };
  chart12Months: {
    labels: string[];
    success: number[];
    failed: number[];
    totalSuccess: number;
    totalFailed: number;
  };
  recentOrders: DashboardRecentOrder[];
};

const MONTH_LABELS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

const successWhere: Prisma.OrderWhereInput = {
  paymentStatus: OrderPaymentStatus.PAID,
  fulfillmentStatus: OrderFulfillmentStatus.SUCCESS,
};

const failedWhere: Prisma.OrderWhereInput = {
  OR: [
    { paymentStatus: { in: [OrderPaymentStatus.FAILED, OrderPaymentStatus.EXPIRED] } },
    {
      fulfillmentStatus: {
        in: [OrderFulfillmentStatus.FAILED, OrderFulfillmentStatus.CANCELLED],
      },
    },
  ],
};

const pendingWhere: Prisma.OrderWhereInput = {
  AND: [
    { NOT: successWhere },
    { NOT: failedWhere },
    {
      OR: [
        { paymentStatus: OrderPaymentStatus.UNPAID },
        {
          paymentStatus: OrderPaymentStatus.PAID,
          fulfillmentStatus: {
            in: [
              OrderFulfillmentStatus.NONE,
              OrderFulfillmentStatus.QUEUED,
              OrderFulfillmentStatus.PROCESSING,
            ],
          },
        },
      ],
    },
  ],
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function yearToDatePeriod(now = new Date()): ReportPeriod {
  const from = startOfDay(new Date(now.getFullYear(), 0, 1));
  const to = endOfDay(now);
  return {
    preset: "custom",
    from,
    to,
    fromKey: toDateKey(from),
    toKey: toDateKey(to),
  };
}

function rollingTwelveMonthWindow(now = new Date()) {
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - 11, 1);
  const from = startOfDay(startMonth);
  const to = endOfDay(now);

  const months: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_LABELS_ID[d.getMonth()]!,
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }

  return { from, to, months };
}

async function aggregateOrders(where: Prisma.OrderWhereInput): Promise<DashboardOrderSummary> {
  const [agg, count] = await Promise.all([
    prisma.order.aggregate({ where, _sum: { amount: true } }),
    prisma.order.count({ where }),
  ]);
  return { amount: agg._sum.amount ?? 0, count };
}

async function aggregatePaidDeposits(): Promise<DashboardOrderSummary> {
  const where = { paymentStatus: OrderPaymentStatus.PAID };
  const [agg, count] = await Promise.all([
    prisma.memberDeposit.aggregate({ where, _sum: { amount: true } }),
    prisma.memberDeposit.count({ where }),
  ]);
  return { amount: agg._sum.amount ?? 0, count };
}

async function buildChart12Months(now = new Date()) {
  const { from, to, months } = rollingTwelveMonthWindow(now);

  type AggRow = {
    month_key: string | null;
    success_count: bigint | number | null;
    failed_count: bigint | number | null;
  };

  const rows = await prisma.$queryRaw<AggRow[]>`
    SELECT
      to_char("createdAt", 'YYYY-MM') AS month_key,
      SUM(
        CASE
          WHEN "paymentStatus" = 'PAID' AND "fulfillmentStatus" = 'SUCCESS' THEN 1
          ELSE 0
        END
      ) AS success_count,
      SUM(
        CASE
          WHEN "paymentStatus" IN ('FAILED', 'EXPIRED')
            OR "fulfillmentStatus" IN ('FAILED', 'CANCELLED')
          THEN 1
          ELSE 0
        END
      ) AS failed_count
    FROM orders
    WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
    GROUP BY to_char("createdAt", 'YYYY-MM')
  `;

  const successMap = new Map<string, number>();
  const failedMap = new Map<string, number>();
  for (const m of months) {
    successMap.set(m.key, 0);
    failedMap.set(m.key, 0);
  }

  for (const row of rows) {
    const key = row.month_key;
    if (!key || !successMap.has(key)) continue;
    successMap.set(key, Number(row.success_count ?? 0));
    failedMap.set(key, Number(row.failed_count ?? 0));
  }

  const success = months.map((m) => successMap.get(m.key) ?? 0);
  const failed = months.map((m) => failedMap.get(m.key) ?? 0);

  return {
    labels: months.map((m) => m.label),
    success,
    failed,
    totalSuccess: success.reduce((a, b) => a + b, 0),
    totalFailed: failed.reduce((a, b) => a + b, 0),
  };
}

export async function getConsoleDashboard(): Promise<ConsoleDashboardData> {
  const now = new Date();
  const year = now.getFullYear();
  const ytd = yearToDatePeriod(now);

  const [
    totalUsers,
    catalog,
    success,
    pending,
    failed,
    topup,
    ytdSummary,
    chart12Months,
    recentOrderRows,
  ] = await Promise.all([
    prisma.member.count(),
    getCatalogStats(),
    aggregateOrders(successWhere),
    aggregateOrders(pendingWhere),
    aggregateOrders(failedWhere),
    aggregatePaidDeposits(),
    getReportSummary(ytd),
    buildChart12Months(now),
    prisma.order.findMany({
      take: 7,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        orderCode: true,
        productNameSnapshot: true,
        skuNameSnapshot: true,
        amount: true,
        playerLabel: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    year,
    summary: {
      totalUsers,
      totalProducts: catalog.totalProducts,
      totalProductSkus: catalog.totalProductSkus,
      netProfitYear: ytdSummary.netProfit,
    },
    ordersAllTime: {
      success,
      pending,
      failed,
      topup,
    },
    chart12Months,
    recentOrders: recentOrderRows,
  };
}

export function formatDashboardIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDashboardNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}
