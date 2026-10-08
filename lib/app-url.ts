function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

/** Base URL publik — sync, env/vercel/localhost saja (tanpa query DB). */
export function getAppUrlSync(): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;

  const port = process.env.PORT?.trim() || "3000";
  return `http://localhost:${port}`;
}

/**
 * Base URL publik.
 * Prioritas: Pengaturan Website → URL Website, lalu APP_URL, lalu vercel/localhost.
 */
export async function getAppUrl(): Promise<string> {
  try {
    const { getSiteSettings } = await import("@/lib/site-settings/get-site-settings");
    const settings = await getSiteSettings();
    const fromSite = settings.general.siteUrl.trim();
    if (fromSite) return trimTrailingSlash(fromSite);
  } catch {
    // DB belum siap.
  }

  return getAppUrlSync();
}

/** Jadikan path relatif (/uploads/...) URL absolut untuk OG / meta. */
export function toAbsoluteUrl(baseUrl: string, pathOrUrl: string): string {
  const value = pathOrUrl.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const base = trimTrailingSlash(baseUrl.trim() || getAppUrlSync());
  return value.startsWith("/") ? `${base}${value}` : `${base}/${value}`;
}
