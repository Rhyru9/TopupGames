const SECRET_KEY_RE =
  /^(api[_-]?key|secret|password|token|webhook[_-]?secret|private[_-]?key|sign|signature)$/i;

function redactValue(key: string, value: unknown): unknown {
  if (SECRET_KEY_RE.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item, i) => redactValue(String(i), item));
  if (value && typeof value === "object") {
    return redactPayload(value as Record<string, unknown>);
  }
  return value;
}

/** Hapus secret sebelum menyimpan ke FulfillmentLog. */
export function redactPayload(input: unknown): unknown {
  if (input == null) return input;
  if (Array.isArray(input)) {
    return input.map((item) => redactPayload(item));
  }
  if (typeof input !== "object") return input;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    out[key] = redactValue(key, value);
  }
  return out;
}
