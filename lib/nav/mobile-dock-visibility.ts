/** Pathname di mana bottom dock disembunyikan (halaman fokus / tanpa nav utama). */
export function isMobileDockHidden(pathname: string): boolean {
  return (
    pathname.startsWith("/console") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/produk/") ||
    pathname.startsWith("/masuk") ||
    pathname.startsWith("/daftar")
  );
}

export function isMobileDockVisible(pathname: string): boolean {
  return !isMobileDockHidden(pathname);
}

/** Breakpoint sama dengan `.mobile-dock { display: none }` di mobile-dock.css */
export const MOBILE_DOCK_MAX_WIDTH = 1023;

export function isMobileDockViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_DOCK_MAX_WIDTH}px)`).matches;
}
