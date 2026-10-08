import { getReportSummary } from "@/lib/reports/get-report-summary";
import { getReportDailySeries } from "@/lib/reports/get-report-series";
import { listExpenses } from "@/lib/reports/get-expense-mutations";
import { calcReportDelta, resolvePreviousPeriod, resolveTrailingMonths, type ReportDelta } from "@/lib/reports/report-compare";
import { formatChartDayLabel } from "@/lib/reports/report-format";
import type { ReportPeriod } from "@/lib/reports/report-period";
import type { ReportDailyPoint, ReportSummary } from "@/lib/reports/report-types";

export type ReportKpiMetric = {
  key: string;
  label: string;
  value: number;
  delta: ReportDelta;
  sparkline: number[];
  tone: "neon" | "cyan" | "violet" | "orange";
  format?: "money" | "count";
};

export type ReportCompositionSlice = {
  name: string;
  value: number;
  color: string;
};

export type ReportPerformanceMetric = {
  label: string;
  hint: string;
  percent: number;
};

export type ReportMonthlyPoint = {
  label: string;
  margin: number;
  expense: number;
  netProfit: number;
  omzet: number;
};

export type ReportTopExpense = {
  description: string;
  amount: number;
  category: string;
};

export type ReportDashboardData = {
  period: ReportPeriod;
  previousLabel: string;
  summary: ReportSummary;
  series: ReportDailyPoint[];
  kpis: ReportKpiMetric[];
  composition: ReportCompositionSlice[];
  performance: ReportPerformanceMetric[];
  monthlyTrend: ReportMonthlyPoint[];
  topExpenses: ReportTopExpense[];
};

function sparkFromSeries(series: ReportDailyPoint[], key: keyof ReportDailyPoint): number[] {
  return series.map((point) => Number(point[key] ?? 0));
}

function netSparkline(series: ReportDailyPoint[]): number[] {
  return series.map((point) => point.orderMargin - point.expense);
}

export async function getReportDashboard(period: ReportPeriod): Promise<ReportDashboardData> {
  const previousPeriod = resolvePreviousPeriod(period);
  const monthlyPeriods = resolveTrailingMonths(6);

  const [summary, previousSummary, series, monthlySummaries, expenses] = await Promise.all([
    getReportSummary(period),
    getReportSummary(previousPeriod),
    getReportDailySeries(period),
    Promise.all(monthlyPeriods.map((item) => getReportSummary(item))),
    listExpenses({ from: period.from, to: period.to, take: 100 }),
  ]);

  const kpis: ReportKpiMetric[] = [
    {
      key: "net",
      label: "Pendapatan bersih",
      value: summary.netProfit,
      delta: calcReportDelta(summary.netProfit, previousSummary.netProfit),
      sparkline: netSparkline(series),
      tone: "neon",
    },
    {
      key: "omzet",
      label: "Nilai transaksi",
      value: summary.orderOmzet,
      delta: calcReportDelta(summary.orderOmzet, previousSummary.orderOmzet),
      sparkline: sparkFromSeries(series, "orderOmzet"),
      tone: "cyan",
    },
    {
      key: "margin",
      label: "Margin SKU",
      value: summary.orderMarginTotal,
      delta: calcReportDelta(summary.orderMarginTotal, previousSummary.orderMarginTotal),
      sparkline: sparkFromSeries(series, "orderMargin"),
      tone: "violet",
    },
    {
      key: "expense",
      label: "Pengeluaran",
      value: summary.expenseTotal,
      delta: calcReportDelta(summary.expenseTotal, previousSummary.expenseTotal),
      sparkline: sparkFromSeries(series, "expense"),
      tone: "orange",
    },
  ];

  const composition: ReportCompositionSlice[] = [
    { name: "Pendapatan bersih", value: Math.max(0, summary.netProfit), color: "#ff7a1a" },
    { name: "Pengeluaran", value: summary.expenseTotal, color: "#ffa94d" },
  ].filter((slice) => slice.value > 0);

  const marginRatio =
    summary.orderOmzet > 0 ? (summary.orderMarginTotal / summary.orderOmzet) * 100 : 0;
  const expenseRatio =
    summary.orderMarginTotal > 0 ? (summary.expenseTotal / summary.orderMarginTotal) * 100 : 0;
  const netMarginRatio =
    summary.orderOmzet > 0 ? (summary.netProfit / summary.orderOmzet) * 100 : 0;

  const performance: ReportPerformanceMetric[] = [
    {
      label: "Rasio margin",
      hint: "Margin ÷ nilai transaksi",
      percent: marginRatio,
    },
    {
      label: "Rasio beban",
      hint: "Pengeluaran ÷ margin",
      percent: expenseRatio,
    },
    {
      label: "Net margin",
      hint: "Pendapatan bersih ÷ nilai transaksi",
      percent: netMarginRatio,
    },
  ];

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthlyTrend: ReportMonthlyPoint[] = monthlySummaries.map((item, index) => {
    const monthDate = monthlyPeriods[index]!.from;
    return {
      label: monthLabels[monthDate.getMonth()] ?? formatChartDayLabel(monthlyPeriods[index]!.fromKey),
      margin: item.orderMarginTotal,
      expense: item.expenseTotal,
      netProfit: item.netProfit,
      omzet: item.orderOmzet,
    };
  });

  const topExpenses: ReportTopExpense[] = [...expenses.items]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((item) => ({
      description: item.description,
      amount: item.amount,
      category: item.category,
    }));

  return {
    period,
    previousLabel: `${previousPeriod.fromKey} s/d ${previousPeriod.toKey}`,
    summary,
    series,
    kpis,
    composition: composition.length
      ? composition
      : [{ name: "Belum ada data", value: 1, color: "#2a2a2a" }],
    performance,
    monthlyTrend,
    topExpenses,
  };
}
