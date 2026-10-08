/** Ambil pesan manusiawi dari respons provider (Digiflazz / Melostore / IAK / dll). */

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function firstNonEmpty(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (t) return t;
    }
    if (typeof c === "number" && Number.isFinite(c)) return String(c);
  }
  return undefined;
}

/**
 * Cari message / error di berbagai bentuk payload yang umum dipakai aggregator.
 */
export function extractProviderMessage(
  raw: unknown,
  fallback?: string,
): string | undefined {
  const root = asRecord(raw);
  const data = asRecord(root.data);
  const errorObj = asRecord(root.error ?? data.error);

  const fromArray = (value: unknown): string | undefined => {
    if (!Array.isArray(value) || value.length === 0) return undefined;
    const parts = value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        const rec = asRecord(item);
        return firstNonEmpty(rec.message, rec.msg, rec.error, rec.description);
      })
      .filter(Boolean);
    return parts.length > 0 ? parts.join("; ") : undefined;
  };

  const msg = firstNonEmpty(
    data.message,
    data.msg,
    data.status_message,
    data.statusMessage,
    data.description,
    data.rc_message,
    data.rcMessage,
    root.message,
    root.msg,
    root.description,
    root.status_message,
    errorObj.message,
    errorObj.msg,
    fromArray(root.errors),
    fromArray(data.errors),
    typeof root.raw === "string" ? root.raw : undefined,
  );

  if (msg) return msg;

  const httpStatus = root.httpStatus ?? data.httpStatus;
  if (typeof httpStatus === "number" && Number.isFinite(httpStatus)) {
    return firstNonEmpty(fallback, `HTTP ${httpStatus}`);
  }

  return firstNonEmpty(fallback);
}
