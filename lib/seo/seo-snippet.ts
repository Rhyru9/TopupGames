/** Truncate text like a Google SERP snippet. */

export function truncateSerpTitle(title: string, max = 60): string {
  const value = title.trim().replace(/\s+/g, " ");
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function truncateSerpDescription(description: string, max = 160): string {
  const value = description.trim().replace(/\s+/g, " ");
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Display URL for snippet: host + path without protocol. */
export function formatSerpUrl(baseUrl: string, path: string): string {
  try {
    const url = new URL(path.startsWith("http") ? path : `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`);
    const host = url.host.replace(/^www\./, "");
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return host;
    return `${host} › ${segments.join(" › ")}`;
  } catch {
    return path;
  }
}
