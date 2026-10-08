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
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { IncomeDashboardData } from "@/lib/reports/get-income-dashboard";
import { formatReportRupiah } from "@/lib/reports/report-format";

const GRID = "rgba(255,255,255,0.06)";
const CHROME = "rgba(255,255,255,0.45)";
const NEON = "#ff7a1a";
const CYAN = "#4ecdc4";

const chartAxis = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fill: CHROME, fontSize: 11 },
};

type IncomeAnalyticsChartsProps = {
  data: IncomeDashboardData;
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

function CountTooltip({
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
          <strong>{entry.value.toLocaleString("id-ID")}</strong>
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
    payload?: { color?: string; name?: string; count?: number };
  }[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]!;
  const color = entry.fill ?? entry.color ?? entry.payload?.color ?? NEON;
  const label = entry.name || entry.payload?.name || "Item";
  const count = entry.payload?.count;
  return (
    <div className="console-chart-tooltip">
      <p className="console-chart-tooltip__row">
        <span className="console-chart-tooltip__dot" style={{ background: color }} />
        <span>{label}</span>
        <strong>{formatReportRupiah(entry.value)}</strong>
      </p>
      {typeof count === "number" ? (
        <p className="console-chart-tooltip__row">
          <span className="console-chart-tooltip__dot" style={{ background: "transparent" }} />
          <span>Order</span>
          <strong>{count.toLocaleString("id-ID")}</strong>
        </p>
      ) : null}
    </div>
  );
}

export function IncomeAnalyticsCharts({ data }: IncomeAnalyticsChartsProps) {
  const topChannelMax = data.topChannels[0]?.value ?? 1;
  const hasRealChannels = data.topChannels.some((item) => item.name !== "Belum ada data");

  return (
    <div className="console-report-analytics-grid">
      <Panel title="Nilai transaksi harian" subtitle="Omzet order PAID per hari" className="span-8">
        <div className="console-report-analytics-panel__chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeOmzetFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CYAN} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CYAN} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" {...chartAxis} dy={8} />
              <YAxis {...chartAxis} width={48} tickFormatter={(v) => `${Math.round(v / 1000)}rb`} />
              <Tooltip
                content={<MoneyTooltip />}
                cursor={{ stroke: "rgba(78,205,196,0.35)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="orderOmzet"
                name="Nilai transaksi"
                stroke={CYAN}
                strokeWidth={2.5}
                fill="url(#incomeOmzetFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Komposisi channel" subtitle="Share nilai transaksi per channel" className="span-4">
        <div className="console-report-analytics-panel__chart console-report-analytics-panel__chart--donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.channelMix}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
              >
                {data.channelMix.map((slice) => (
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

      <Panel title="Margin vs nilai transaksi" subtitle="Perbandingan harian" className="span-8">
        <div className="console-report-analytics-panel__chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" {...chartAxis} dy={8} />
              <YAxis {...chartAxis} width={48} tickFormatter={(v) => `${Math.round(v / 1000)}rb`} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(255, 122, 26, 0.06)" }} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => <span style={{ color: CHROME }}>{value}</span>}
              />
              <Bar
                dataKey="orderOmzet"
                name="Nilai transaksi"
                fill={CYAN}
                radius={[3, 3, 0, 0]}
                maxBarSize={22}
              />
              <Bar
                dataKey="orderMargin"
                name="Margin"
                fill={NEON}
                radius={[3, 3, 0, 0]}
                maxBarSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Guest vs member" subtitle="Komposisi nilai transaksi" className="span-4">
        <div className="console-report-analytics-panel__chart console-report-analytics-panel__chart--donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.buyerMix}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
              >
                {data.buyerMix.map((slice) => (
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

      <Panel title="Order PAID harian" subtitle="Jumlah transaksi lunas" className="span-4">
        <div className="console-report-analytics-panel__chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" {...chartAxis} dy={8} />
              <YAxis {...chartAxis} width={36} allowDecimals={false} />
              <Tooltip
                content={<CountTooltip />}
                cursor={{ stroke: "rgba(177,151,252,0.35)", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="orderCount"
                name="Order"
                stroke="#b197fc"
                strokeWidth={2}
                dot={{ r: 3, fill: "#b197fc", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: "#b197fc" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Top channel"
        subtitle={hasRealChannels ? "Channel dengan nilai transaksi terbesar" : "Belum ada data channel"}
        className="span-8"
      >
        {!hasRealChannels ? (
          <p className="console-report-empty">Belum ada pemasukan pada periode ini.</p>
        ) : (
          <ul className="console-report-top-expenses">
            {data.topChannels.map((item) => (
              <li key={item.name} className="console-report-top-expenses__item">
                <div className="console-report-top-expenses__meta">
                  <strong>{item.name}</strong>
                  <span style={{ color: item.color }}>{formatReportRupiah(item.value)}</span>
                </div>
                <p className="console-report-top-expenses__hint">
                  {item.count.toLocaleString("id-ID")} order
                </p>
                <div className="console-report-top-expenses__bar">
                  <span
                    style={{
                      width: `${Math.round((item.value / topChannelMax) * 100)}%`,
                      background: `linear-gradient(90deg, ${item.color}66, ${item.color})`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
