import { formatReportRupiah } from "@/lib/reports/report-format";
import type { ReportKpiMetric } from "@/lib/reports/get-report-dashboard";

type ReportAnalyticsKpiProps = {
  metrics: ReportKpiMetric[];
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return <div className="console-report-kpi-card__sparkline console-report-kpi-card__sparkline--empty" />;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="console-report-kpi-card__sparkline"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function resolveDeltaTone(metric: ReportKpiMetric): ReportKpiMetric["delta"]["tone"] {
  if (metric.key !== "expense") return metric.delta.tone;
  if (metric.delta.tone === "up") return "down";
  if (metric.delta.tone === "down") return "up";
  return "flat";
}

function KpiIcon({ tone }: { tone: ReportKpiMetric["tone"] }) {
  return (
    <span className={`console-report-kpi-card__icon console-report-kpi-card__icon--${tone}`} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        {tone === "neon" ? (
          <path d="M12 3v18M8 7l4-4 4 4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        ) : tone === "orange" ? (
          <path d="M12 21V9M8 17l4 4 4-4M5 3h14" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" strokeLinecap="round" />
        )}
      </svg>
    </span>
  );
}

export function ReportAnalyticsKpi({ metrics }: ReportAnalyticsKpiProps) {
  const sparkColors: Record<ReportKpiMetric["tone"], string> = {
    neon: "#ff7a1a",
    cyan: "#4ecdc4",
    violet: "#b197fc",
    orange: "#ffa94d",
  };

  return (
    <div className="console-report-kpi-cards">
      {metrics.map((metric) => {
        const deltaTone = resolveDeltaTone(metric);
        return (
          <article
            key={metric.key}
            className={`console-report-kpi-card console-report-kpi-card--${metric.tone}${
              metric.key === "net" ? " console-report-kpi-card--primary" : ""
            }`}
          >
            <div className="console-report-kpi-card__head">
              <div>
                <p className="console-report-kpi-card__label">{metric.label}</p>
                <p className="console-report-kpi-card__value">
                  {metric.format === "count"
                    ? metric.value.toLocaleString("id-ID")
                    : formatReportRupiah(metric.value)}
                </p>
              </div>
              <KpiIcon tone={metric.tone} />
            </div>

            <p className={`console-report-kpi-card__delta console-report-kpi-card__delta--${deltaTone}`}>
              {metric.delta.label}
              <span>vs periode lalu</span>
            </p>

            <Sparkline data={metric.sparkline} color={sparkColors[metric.tone]} />
          </article>
        );
      })}
    </div>
  );
}
