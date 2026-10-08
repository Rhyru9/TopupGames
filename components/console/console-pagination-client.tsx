"use client";

import {
  ALLOWED_PAGE_SIZES,
  getPaginationRange,
  getPaginationWindow,
} from "@/lib/console-pagination";

type ConsolePaginationClientProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function ConsolePaginationClient({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: ConsolePaginationClientProps) {
  const { start, end, totalPages } = getPaginationRange(page, pageSize, total);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pages = getPaginationWindow(safePage, totalPages);

  if (total === 0) return null;

  return (
    <div className="console-pagination">
      <div className="console-pagination__meta-row">
        <p className="console-pagination__meta">
          Menampilkan <strong>{start}</strong>–<strong>{end}</strong> dari <strong>{total}</strong>
        </p>
        {onPageSizeChange ? (
          <label className="console-pagination__size">
            <span className="console-pagination__size-label">Per halaman</span>
            <select
              className="console-input console-pagination__size-select"
              aria-label="Jumlah baris per halaman"
              value={pageSize}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                onPageSizeChange(next);
              }}
            >
              {ALLOWED_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <nav className="console-pagination__nav" aria-label="Paginasi daftar SKU">
        <button
          type="button"
          className={`console-pagination__btn ${
            safePage <= 1 ? "console-pagination__btn--disabled" : ""
          }`}
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Sebelumnya
        </button>

        <div className="console-pagination__pages">
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`console-pagination__page ${
                pageNumber === safePage ? "console-pagination__page--active" : ""
              }`}
              aria-current={pageNumber === safePage ? "page" : undefined}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`console-pagination__btn ${
            safePage >= totalPages ? "console-pagination__btn--disabled" : ""
          }`}
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Berikutnya
        </button>
      </nav>
    </div>
  );
}
