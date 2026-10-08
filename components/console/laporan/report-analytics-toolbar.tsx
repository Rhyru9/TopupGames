"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatReportDate } from "@/lib/reports/report-format";
import type { ReportPreset } from "@/lib/reports/report-period";

type ReportAnalyticsToolbarProps = {
  basePath: string;
  preset: ReportPreset;
  fromKey: string;
  toKey: string;
  exportHref?: string;
};

const PRESETS: { value: Exclude<ReportPreset, "custom">; label: string }[] = [
  { value: "today", label: "Hari ini" },
  { value: "7d", label: "7 hari" },
  { value: "month", label: "Bulan ini" },
  { value: "last_month", label: "Bulan lalu" },
];

function formatRangeLabel(fromKey: string, toKey: string): string {
  const parse = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  return `${formatReportDate(parse(fromKey))} – ${formatReportDate(parse(toKey))}`;
}

export function ReportAnalyticsToolbar({
  basePath,
  preset,
  fromKey,
  toKey,
  exportHref,
}: ReportAnalyticsToolbarProps) {
  const router = useRouter();
  const rangeId = useId();
  const filterId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(fromKey);
  const [draftTo, setDraftTo] = useState(toKey);

  useEffect(() => {
    setDraftFrom(fromKey);
    setDraftTo(toKey);
  }, [fromKey, toKey]);

  useEffect(() => {
    if (!rangeOpen && !filterOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setRangeOpen(false);
        setFilterOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRangeOpen(false);
        setFilterOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [rangeOpen, filterOpen]);

  function navigate(next: { preset: string; from?: string; to?: string }) {
    const params = new URLSearchParams();
    params.set("preset", next.preset);
    if (next.preset === "custom") {
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  const activePresetLabel =
    PRESETS.find((item) => item.value === preset)?.label ?? "Custom";

  return (
    <div className="console-report-filter-bar" ref={wrapRef}>
      <div className="console-report-filter-bar__side">
        <button
          type="button"
          className={`console-report-filter-bar__range${rangeOpen ? " is-open" : ""}`}
          aria-expanded={rangeOpen}
          aria-controls={rangeId}
          onClick={() => {
            setFilterOpen(false);
            setRangeOpen((open) => !open);
          }}
        >
          <svg viewBox="0 0 24 24" className="console-report-filter-bar__icon" aria-hidden>
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
            <path d="M8 3.5v3.5M16 3.5v3.5M3.5 10h17" strokeLinecap="round" />
          </svg>
          <span>{formatRangeLabel(fromKey, toKey)}</span>
        </button>

        <button
          type="button"
          className={`console-report-filter-bar__icon-btn${filterOpen ? " is-open" : ""}`}
          aria-label={`Filter periode${preset !== "custom" ? `: ${activePresetLabel}` : ""}`}
          aria-expanded={filterOpen}
          aria-controls={filterId}
          title={activePresetLabel}
          onClick={() => {
            setRangeOpen(false);
            setFilterOpen((open) => !open);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
        </button>

        {exportHref ? (
          <a href={exportHref} className="console-report-filter-bar__export" title="Unduh Excel">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 4v10M8 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 19h14" strokeLinecap="round" />
            </svg>
            Excel
          </a>
        ) : null}
      </div>

      {filterOpen ? (
        <div id={filterId} className="console-report-filter-bar__menu" role="menu">
          {PRESETS.map((item) => {
            const active = preset === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`console-report-filter-bar__menu-item${active ? " is-active" : ""}`}
                onClick={() => {
                  navigate({ preset: item.value });
                  setFilterOpen(false);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {rangeOpen ? (
        <form
          id={rangeId}
          className="console-report-filter-bar__popover"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ preset: "custom", from: draftFrom, to: draftTo });
            setRangeOpen(false);
          }}
        >
          <p className="console-report-filter-bar__popover-title">Rentang tanggal</p>
          <div className="console-report-filter-bar__popover-fields">
            <label className="console-report-filter-bar__field">
              <span>Dari</span>
              <input
                type="date"
                value={draftFrom}
                onChange={(event) => setDraftFrom(event.target.value)}
                className="console-input"
                required
              />
            </label>
            <label className="console-report-filter-bar__field">
              <span>Sampai</span>
              <input
                type="date"
                value={draftTo}
                onChange={(event) => setDraftTo(event.target.value)}
                className="console-input"
                required
              />
            </label>
          </div>
          <div className="console-report-filter-bar__popover-actions">
            <button type="button" className="console-btn-ghost" onClick={() => setRangeOpen(false)}>
              Batal
            </button>
            <button type="submit" className="console-btn-primary">
              Terapkan
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
