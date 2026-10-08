import type {
  GridBreakpointCols,
  GridColumnCount,
  GridGapDensity,
} from "@/lib/site-settings/site-settings-schemas";

const MOBILE_COLS: Record<GridColumnCount, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const TABLET_COLS: Record<GridColumnCount, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

const DESKTOP_COLS: Record<GridColumnCount, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

const GAP_CLASS: Record<GridGapDensity, string> = {
  tight: "gap-2 sm:gap-2.5 md:gap-3 lg:gap-3",
  normal: "gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4",
  relaxed: "gap-3 sm:gap-3.5 md:gap-4 lg:gap-5",
};

/** Class grid Tailwind statis dari setting kolom + jarak (hindari dynamic class JIT). */
export function gridColsClass(
  columns: GridBreakpointCols,
  gap: GridGapDensity = "normal",
): string {
  return [
    "grid",
    MOBILE_COLS[columns.mobile],
    TABLET_COLS[columns.tablet],
    DESKTOP_COLS[columns.desktop],
    GAP_CLASS[gap],
  ].join(" ");
}

export function catalogPageSize(desktopCols: GridColumnCount, pageRows: number): number {
  const rows = Math.min(6, Math.max(1, Math.floor(pageRows) || 3));
  return desktopCols * rows;
}
