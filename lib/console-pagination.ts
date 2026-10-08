export const DEFAULT_PAGE_SIZE = 15;

export const ALLOWED_PAGE_SIZES = [10, 15, 25, 50, 100, 250, 500] as const;

export type AllowedPageSize = (typeof ALLOWED_PAGE_SIZES)[number];

export type ConsolePaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
};

export type ConsoleQueryRecord = Record<string, string | undefined | null>;

export function parsePageSize(
  raw: string | number | null | undefined,
  fallback: number = DEFAULT_PAGE_SIZE,
): number {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isFinite(n)) return fallback;
  const size = Math.trunc(n);
  return (ALLOWED_PAGE_SIZES as readonly number[]).includes(size) ? size : fallback;
}

export function parsePagination(
  searchParams: ConsoleQueryRecord,
  defaultPageSize: number = DEFAULT_PAGE_SIZE,
): ConsolePaginationParams {
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;
  const pageSize = parsePageSize(searchParams.pageSize, defaultPageSize);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}

export function buildConsoleQuery(
  baseParams: ConsoleQueryRecord,
  overrides: ConsoleQueryRecord = {},
): string {
  const merged: Record<string, string> = {};

  for (const [key, value] of Object.entries({ ...baseParams, ...overrides })) {
    if (value === undefined || value === null || value === "") continue;
    merged[key] = value;
  }

  const query = new URLSearchParams(merged).toString();
  return query ? `?${query}` : "";
}

export function getPaginationRange(page: number, pageSize: number, total: number) {
  if (total === 0) {
    return { start: 0, end: 0, totalPages: 1 };
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return { start, end, totalPages };
}

export function getPaginationWindow(currentPage: number, totalPages: number, radius = 2) {
  const start = Math.max(1, currentPage - radius);
  const end = Math.min(totalPages, currentPage + radius);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}
