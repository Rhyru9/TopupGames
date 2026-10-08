export type ConsoleToastVariant = "success" | "error";

/**
 * Sisipkan pesan toast ke URL redirect.
 * Pesan didefinisikan di modul masing-masing fitur (bukan registry global).
 */
export function withToastUrl(
  url: string,
  message?: string,
  variant: ConsoleToastVariant = "success",
): string {
  if (!message) return url;

  const [pathname, search = ""] = url.split("?", 2);
  const params = new URLSearchParams(search);
  params.set("toast", message);
  if (variant !== "success") {
    params.set("toastVariant", variant);
  } else {
    params.delete("toastVariant");
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
