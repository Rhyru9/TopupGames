"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALLOWED_PAGE_SIZES,
  buildConsoleQuery,
  getPaginationRange,
  getPaginationWindow,
  type ConsoleQueryRecord,
} from "@/lib/console-pagination";

type ConsolePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query?: ConsoleQueryRecord;
};

export function ConsolePagination({
  page,
  pageSize,
  total,
  basePath,
  query = {},
}: ConsolePaginationProps) {
  const router = useRouter();
  const { start, end, totalPages } = getPaginationRange(page, pageSize, total);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pages = getPaginationWindow(safePage, totalPages);

  if (total === 0) return null;

  const baseQuery = { ...query };
  delete baseQuery.page;
  delete baseQuery.toast;
  delete baseQuery.success;

  const withPageSize = {
    ...baseQuery,
    pageSize: String(pageSize),
  };

  function hrefFor(targetPage: number) {
    return `${basePath}${buildConsoleQuery(withPageSize, { page: String(targetPage) })}`;
  }

  function hrefForPageSize(nextSize: number) {
    return `${basePath}${buildConsoleQuery(baseQuery, {
      pageSize: String(nextSize),
      page: "1",
    })}`;
  }

  return (
    <div className="console-pagination">
      <div className="console-pagination__meta-row">
        <p className="console-pagination__meta">
          Menampilkan <strong>{start}</strong>–<strong>{end}</strong> dari <strong>{total}</strong>
        </p>
        <label className="console-pagination__size">
          <span className="console-pagination__size-label">Per halaman</span>
          <select
            className="console-input console-pagination__size-select"
            aria-label="Jumlah baris per halaman"
            value={pageSize}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) return;
              router.push(hrefForPageSize(next));
            }}
          >
            {ALLOWED_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav className="console-pagination__nav" aria-label="Paginasi">
        {safePage <= 1 ? (
          <span className="console-pagination__btn console-pagination__btn--disabled">Sebelumnya</span>
        ) : (
          <Link href={hrefFor(safePage - 1)} className="console-pagination__btn">
            Sebelumnya
          </Link>
        )}

        <div className="console-pagination__pages">
          {pages.map((pageNumber) => (
            <Link
              key={pageNumber}
              href={hrefFor(pageNumber)}
              className={`console-pagination__page ${
                pageNumber === safePage ? "console-pagination__page--active" : ""
              }`}
              aria-current={pageNumber === safePage ? "page" : undefined}
            >
              {pageNumber}
            </Link>
          ))}
        </div>

        {safePage >= totalPages ? (
          <span className="console-pagination__btn console-pagination__btn--disabled">Berikutnya</span>
        ) : (
          <Link href={hrefFor(safePage + 1)} className="console-pagination__btn">
            Berikutnya
          </Link>
        )}
      </nav>
    </div>
  );
}
