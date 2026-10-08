"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ConsoleOrderChartProps = {
  labels: readonly string[];
  success: readonly number[];
  failed: readonly number[];
  totalSuccess: number;
  totalFailed: number;
};

type ChartPoint = {
  month: string;
  success: number;
  failed: number;
};

function buildChartData(
  labels: readonly string[],
  success: readonly number[],
  failed: readonly number[],
): ChartPoint[] {
  return labels.map((month, index) => ({
    month,
    success: success[index] ?? 0,
    failed: failed[index] ?? 0,
  }));
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="console-chart-tooltip">
      <p className="console-chart-tooltip__title">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="console-chart-tooltip__row">
          <span
            className="console-chart-tooltip__dot"
            style={{ background: entry.color }}
          />
          <span>{entry.dataKey === "success" ? "Sukses" : "Gagal"}</span>
          <strong>{entry.value.toLocaleString("id-ID")} pesanan</strong>
        </p>
      ))}
    </div>
  );
}

export function ConsoleOrderChart({
  labels,
  success,
  failed,
  totalSuccess,
  totalFailed,
}: ConsoleOrderChartProps) {
  const data = buildChartData(labels, success, failed);
  const isEmpty = totalSuccess + totalFailed === 0;

  return (
    <div className="console-chart">
      <div className="console-chart__legend">
        <span className="console-chart__legend-item">
          <span className="console-chart__dot console-chart__dot--success" />
          Sukses: <strong>{totalSuccess.toLocaleString("id-ID")}</strong>
        </span>
        <span className="console-chart__legend-item">
          <span className="console-chart__dot console-chart__dot--failed" />
          Gagal: <strong>{totalFailed.toLocaleString("id-ID")}</strong>
        </span>
      </div>

      {isEmpty ? (
        <div className="console-chart__empty">
          <p className="console-chart__empty-title">Belum ada data pesanan</p>
          <p className="console-chart__empty-text">
            Grafik akan muncul setelah ada order sukses atau gagal dalam 12 bulan terakhir.
          </p>
        </div>
      ) : (
        <div className="console-chart__canvas">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 12 }}>
              <defs>
                <linearGradient id="consoleSuccessFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7a1a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ff7a1a" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="consoleFailedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                dy={8}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                width={36}
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                allowDecimals={false}
              />

              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,122,26,0.25)", strokeWidth: 1 }} />

              <Area
                type="monotone"
                dataKey="failed"
                stroke="#f87171"
                strokeWidth={2}
                fill="url(#consoleFailedFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#f87171" }}
              />

              <Area
                type="monotone"
                dataKey="success"
                stroke="#ff7a1a"
                strokeWidth={2.5}
                fill="url(#consoleSuccessFill)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: "#ff7a1a" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
