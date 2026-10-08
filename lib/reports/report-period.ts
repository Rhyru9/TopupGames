export type ReportPreset = "today" | "7d" | "month" | "last_month" | "custom";

export type ReportPeriod = {
  preset: ReportPreset;
  from: Date;
  to: Date;
  fromKey: string;
  toKey: string;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDateKey(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function resolveReportPeriod(params: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
}): ReportPeriod {
  const now = new Date();
  const presetRaw = (params.preset ?? "month").trim() as ReportPreset;
  const preset: ReportPreset = ["today", "7d", "month", "last_month", "custom"].includes(presetRaw)
    ? presetRaw
    : "month";

  if (preset === "custom") {
    const fromParsed = parseDateKey(params.from ?? "") ?? startOfDay(now);
    const toParsed = parseDateKey(params.to ?? "") ?? endOfDay(now);
    const from = startOfDay(fromParsed);
    const to = endOfDay(toParsed.getTime() < from.getTime() ? fromParsed : toParsed);
    return { preset, from, to, fromKey: toDateKey(from), toKey: toDateKey(to) };
  }

  if (preset === "today") {
    const from = startOfDay(now);
    const to = endOfDay(now);
    return { preset, from, to, fromKey: toDateKey(from), toKey: toDateKey(to) };
  }

  if (preset === "7d") {
    const to = endOfDay(now);
    const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
    return { preset, from, to, fromKey: toDateKey(from), toKey: toDateKey(to) };
  }

  if (preset === "last_month") {
    const from = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    return { preset, from, to, fromKey: toDateKey(from), toKey: toDateKey(to) };
  }

  // month
  const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = endOfDay(now);
  return { preset: "month", from, to, fromKey: toDateKey(from), toKey: toDateKey(to) };
}

export function eachDateKey(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor.getTime() <= end.getTime()) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function dateKeyFromDate(value: Date): string {
  return toDateKey(value);
}
