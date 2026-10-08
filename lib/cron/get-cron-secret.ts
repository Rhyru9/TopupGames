import { getSiteSettings } from "@/lib/site-settings/get-site-settings";

/**
 * Secret untuk endpoint cron.
 * Prioritas: secret di Pengaturan Website (DB), lalu env CRON_SECRET.
 */
export async function getResolvedCronSecret(): Promise<string | null> {
  try {
    const settings = await getSiteSettings();
    const fromDb = settings.cron.secret.trim();
    if (fromDb) return fromDb;
  } catch {
    // DB belum siap
  }

  const fromEnv = process.env.CRON_SECRET?.trim();
  return fromEnv || null;
}
