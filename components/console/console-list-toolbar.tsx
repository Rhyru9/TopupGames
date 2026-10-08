"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type ConsoleListToolbarProps = {
  pending?: boolean;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Select / controls shown inline on desktop (right side). */
  desktopFilters?: ReactNode;
  /**
   * Fields for mobile popover. If omitted/null and no desktopFilters,
   * mobile filter button is hidden.
   */
  mobileFilterFields?: ReactNode;
  mobileTitle?: string;
  filterActive?: boolean;
  onMobileApply?: () => void;
  onMobileReset?: () => void;
};

export function ConsoleListToolbar({
  pending = false,
  searchPlaceholder = "Cari…",
  searchAriaLabel = "Cari",
  searchValue,
  onSearchChange,
  desktopFilters,
  mobileFilterFields,
  mobileTitle = "Filter",
  filterActive = false,
  onMobileApply,
  onMobileReset,
}: ConsoleListToolbarProps) {
  const statusId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const showMobileFilter = Boolean(mobileFilterFields ?? desktopFilters);

  useEffect(() => {
    if (!statusOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setStatusOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setStatusOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [statusOpen]);

  return (
    <div
      className={`console-list-toolbar${pending ? " console-table-toolbar--pending" : ""}`}
      ref={wrapRef}
    >
      <div className="console-report-filter-bar console-list-filter-bar">
        <div className="console-list-filter-bar__search">
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="console-input console-list-filter-bar__search-input"
            aria-label={searchAriaLabel}
          />
        </div>

        {desktopFilters ? (
          <div className="console-list-filter-bar__desktop">{desktopFilters}</div>
        ) : null}

        {showMobileFilter ? (
          <div className="console-list-filter-bar__mobile">
            <button
              type="button"
              className={`console-report-filter-bar__icon-btn${statusOpen || filterActive ? " is-open" : ""}`}
              aria-label="Filter"
              aria-expanded={statusOpen}
              aria-controls={statusId}
              title={mobileTitle}
              onClick={() => setStatusOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
              </svg>
            </button>

            {statusOpen ? (
              <form
                id={statusId}
                className="console-report-filter-bar__popover console-list-filter-bar__popover"
                onSubmit={(event) => {
                  event.preventDefault();
                  onMobileApply?.();
                  setStatusOpen(false);
                }}
              >
                <p className="console-report-filter-bar__popover-title">{mobileTitle}</p>
                <div className="console-report-filter-bar__popover-fields">
                  {mobileFilterFields ?? desktopFilters}
                </div>
                <div className="console-report-filter-bar__popover-actions">
                  {onMobileReset ? (
                    <button
                      type="button"
                      className="console-btn-ghost"
                      onClick={() => {
                        onMobileReset();
                        setStatusOpen(false);
                      }}
                    >
                      Reset
                    </button>
                  ) : null}
                  <button type="submit" className="console-btn-primary">
                    Terapkan
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
