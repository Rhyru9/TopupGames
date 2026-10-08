// DOKU retries at 30 minutes, 6 hours and 12 hours. Allow a day by default
// because its documentation does not guarantee a fresh timestamp on retries.
export function isDokuTimestampAcceptable(timestamp: string, now = Date.now()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(timestamp)) return false;
  const time = Date.parse(timestamp);
  if (!Number.isFinite(time)) return false;
  const parsed = Number(process.env.DOKU_NOTIFICATION_MAX_AGE_SECONDS ?? 86400);
  const maxAge = Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : 86400_000;
  return time <= now + 5 * 60_000 && time >= now - maxAge;
}
