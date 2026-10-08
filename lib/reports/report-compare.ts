import type { ReportPeriod } from "@/lib/reports/report-period";
import { eachDateKey, resolveReportPeriod } from "@/lib/reports/report-period";

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

/** Periode sebelumnya dengan durasi hari yang sama. */
export function resolvePreviousPeriod(period: ReportPeriod): ReportPeriod {
  const dayCount = eachDateKey(period.from, period.to).length;
  const prevTo = endOfDay(new Date(period.from.getFullYear(), period.from.getMonth(), period.from.getDate() - 1));
  const prevFrom = startOfDay(
    new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate() - (dayCount - 1)),
  );

  return {
    preset: "custom",
    from: prevFrom,
    to: prevTo,
    fromKey: toDateKey(prevFrom),
    toKey: toDateKey(prevTo),
  };
}

export type ReportDelta = {
  value: number | null;
  label: string;
  tone: "up" | "down" | "flat";
};

export function calcReportDelta(current: number, previous: number): ReportDelta {
  if (previous === 0) {
    if (current === 0) return { value: 0, label: "0%", tone: "flat" };
    return { value: null, label: "Baru", tone: "up" };
  }

  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.abs(pct) >= 100 ? Math.round(pct) : Number(pct.toFixed(1));
  const sign = rounded > 0 ? "+" : "";
  return {
    value: rounded,
    label: `${sign}${rounded}%`,
    tone: rounded > 0 ? "up" : rounded < 0 ? "down" : "flat",
  };
}

export function resolveTrailingMonths(count: number, anchor: Date = new Date()): ReportPeriod[] {
  const periods: ReportPeriod[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);
    periods.push(
      resolveReportPeriod({
        preset: "custom",
        from: toDateKey(monthDate),
        to: toDateKey(
          offset === 0
            ? anchor
            : new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0),
        ),
      }),
    );
  }
  return periods;
}
