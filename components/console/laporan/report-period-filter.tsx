"use client";

import { useRouter } from "next/navigation";
import { formatReportDate } from "@/lib/reports/report-format";
import type { ReportPreset } from "@/lib/reports/report-period";

type ReportPeriodFilterProps = {
  basePath: string;
  preset: ReportPreset;
  fromKey: string;
  toKey: string;
  extraQuery?: Record<string, string | undefined>;
};

const PRESETS: { value: ReportPreset; label: string }[] = [
  { value: "today", label: "Hari ini" },
  { value: "7d", label: "7 hari" },
  { value: "month", label: "Bulan ini" },
  { value: "last_month", label: "Bulan lalu" },
  { value: "custom", label: "Custom" },
];

function formatRangeLabel(fromKey: string, toKey: string): string {
  const parse = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  return `${formatReportDate(parse(fromKey))} – ${formatReportDate(parse(toKey))}`;
}

export function ReportPeriodFilter({
  basePath,
  preset,
  fromKey,
  toKey,
  extraQuery = {},
}: ReportPeriodFilterProps) {
  const router = useRouter();

  function push(next: { preset: string; from?: string; to?: string }) {
    const params = new URLSearchParams();
    params.set("preset", next.preset);
    if (next.preset === "custom") {
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
    }
    for (const [key, value] of Object.entries(extraQuery)) {
      if (value) params.set(key, value);
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="console-report-toolbar">
      <div className="console-report-toolbar__presets">
        {PRESETS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`console-report-toolbar__chip${preset === item.value ? " is-active" : ""}`}
            onClick={() =>
              push({
                preset: item.value,
                from: fromKey,
                to: toKey,
              })
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="console-report-toolbar__meta">
        {preset === "custom" ? (
          <form
            className="console-report-toolbar__custom"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              push({
                preset: "custom",
                from: String(form.get("from") ?? ""),
                to: String(form.get("to") ?? ""),
              });
            }}
          >
            <input
              type="date"
              name="from"
              defaultValue={fromKey}
              className="console-input"
              required
            />
            <span className="console-report-toolbar__sep">s/d</span>
            <input type="date" name="to" defaultValue={toKey} className="console-input" required />
            <button type="submit" className="console-btn-secondary">
              Terapkan
            </button>
          </form>
        ) : (
          <p className="console-report-toolbar__range">{formatRangeLabel(fromKey, toKey)}</p>
        )}
      </div>
    </div>
  );
}
