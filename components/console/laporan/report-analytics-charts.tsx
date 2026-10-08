"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportDashboardData } from "@/lib/reports/get-report-dashboard";
import { formatReportRupiah } from "@/lib/reports/report-format";
import { EXPENSE_CATEGORY_LABEL, type ExpenseCategoryValue } from "@/lib/reports/expense-labels";

const GRID = "rgba(255,255,255,0.06)";
const CHROME = "rgba(255,255,255,0.45)";
const NEON = "#ff7a1a";
const PINK = "#ff6b9d";
const CYAN = "#4ecdc4";

const chartAxis = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fill: CHROME, fontSize: 11 },
};

type ReportAnalyticsChartsProps = {
  data: ReportDashboardData;
};

function Panel({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`console-report-analytics-panel${className ? ` ${className}` : ""}`}>
      <div className="console-report-analytics-panel__head">
        <h3 className="console-report-analytics-panel__title">{title}</h3>
        {subtitle ? <p className="console-report-analytics-panel__subtitle">{subtitle}</p> : null}
      </div>
      <div className="console-report-analytics-panel__body">{children}</div>
    </section>
  );
}

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="console-chart-tooltip">
      {label ? <p className="console-chart-tooltip__title">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} className="console-chart-tooltip__row">
          <span className="console-chart-tooltip__dot" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <strong>{formatReportRupiah(entry.value)}</strong>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    color?: string;
    fill?: string;
    payload?: { color?: string; category?: string; name?: string };
  }[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]!;
  const color = entry.fill ?? entry.color ?? entry.payload?.color ?? "#ff7a1a";
  const label = entry.name || entry.payload?.name || entry.payload?.category || "Item";
  return (
    <div className="console-chart-tooltip">
      <p className="console-chart-tooltip__row">
        <span className="console-chart-tooltip__dot" style={{ background: color }} />
        <span>{label}</span>
        <strong>{formatReportRupiah(entry.value)}</strong>
      </p>
    </div>
  );
}

export function ReportAnalyticsCharts({ data }: ReportAnalyticsChartsProps) {
  const netSeries = data.series.map((point) => ({
    ...point,
    netProfit: point.orderMargin - point.expense,
  }));

  const expenseMix = data.summary.expenseByCategory;
  const topExpenseMax = data.topExpenses[0]?.amount ?? 1;

  return (
    <div className="console-report-analytics-grid">
      <Panel title="Pendapatan bersih" subtitle="Tren harian pada periode aktif" className="span-8">
        <div className="console-report-analytics-panel__chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netSeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="netProfitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NEON} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={NEON} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" {...chartAxis} dy={8} />
              <YAxis {...chartAxis} width={48} tickFormatter={(v) => `${Math.round(v / 1000)}rb`} />
              <Tooltip
                content={<MoneyTooltip />}
                cursor={{ stroke: "rgba(255,122,26,0.25)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="netProfit"
                name="Pendapatan bersih"
                stroke={NEON}
                strokeWidth={2.5}
                fill="url(#netProfitFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Komposisi margin" subtitle="Pengeluaran vs pendapatan bersih" className="span-4">
        <div className="console-report-analytics-panel__chart console-report-analytics-panel__chart--donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.composition}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
              >
                {data.composition.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => <span style={{ color: CHROME }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Tren keuangan" subtitle="6 bulan terakhir" className="span-8">
        <div className="console-report-analytics-panel__chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" {...chartAxis} dy={8} />
              <YAxis {...chartAxis} width={48} tickFormatter={(v) => `${Math.round(v / 1000)}rb`} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(255, 122, 26, 0.06)" }} />
              <Bar dataKey="expense" name="Pengeluaran" fill={PINK} radius={[3, 3, 0, 0]} maxBarSize={22} />
              <Bar dataKey="netProfit" name="Pendapatan bersih" fill={NEON} radius={[3, 3, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Ringkasan kinerja" subtitle="Rasio utama periode ini" className="span-4">
        <ul className="console-report-performance">
          {data.performance.map((item) => (
            <li key={item.label} className="console-report-performance__item">
              <div className="console-report-performance__meta">
                <strong>{item.label}</strong>
                <span>{item.percent.toFixed(1)}%</span>
              </div>
              <p className="console-report-performance__hint">{item.hint}</p>
              <div className="console-report-performance__bar">
                <span style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {expenseMix.length > 0 ? (
        <Panel title="Pengeluaran per kategori" className="span-4">
          <div className="console-report-analytics-panel__chart console-report-analytics-panel__chart--donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseMix}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {expenseMix.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={["#ffa94d", "#ff6b9d", "#b197fc", "#4ecdc4", "#ff7a1a", "#9a9a9a"][index % 6]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => <span style={{ color: CHROME }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Top pengeluaran"
        subtitle={data.topExpenses.length ? "Beban terbesar periode ini" : "Belum ada pengeluaran"}
        className={expenseMix.length > 0 ? "span-8" : "span-12"}
      >
        {data.topExpenses.length === 0 ? (
          <p className="console-report-empty">Tidak ada pengeluaran pada periode ini.</p>
        ) : (
          <ul className="console-report-top-expenses">
            {data.topExpenses.map((item) => (
              <li key={`${item.description}-${item.amount}`} className="console-report-top-expenses__item">
                <div className="console-report-top-expenses__meta">
                  <strong>{item.description}</strong>
                  <span>{formatReportRupiah(item.amount)}</span>
                </div>
                <p className="console-report-top-expenses__hint">
                  {EXPENSE_CATEGORY_LABEL[item.category as ExpenseCategoryValue] ?? item.category}
                </p>
                <div className="console-report-top-expenses__bar">
                  <span style={{ width: `${Math.round((item.amount / topExpenseMax) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
