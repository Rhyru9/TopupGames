import type { Prisma } from "@/app/generated/prisma/client";

/** Bersihkan nilai form akun → map string non-kosong. */
export function cleanPlayerFields(values: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    const text = String(value ?? "").trim();
    if (text) cleaned[key] = text;
  }
  return cleaned;
}

/** Parse JSON playerFields aman ke Record. */
export function playerFieldsToRecord(playerFields: unknown): Record<string, string> {
  if (!playerFields || typeof playerFields !== "object" || Array.isArray(playerFields)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(playerFields as Record<string, unknown>)) {
    const text = String(value ?? "").trim();
    if (text) out[key] = text;
  }
  return out;
}

/** Ringkasan tampilan/search dari playerFields (urut key stabil). */
export function buildPlayerLabel(fields: Record<string, string>): string | null {
  const parts = Object.keys(fields)
    .sort()
    .map((key) => fields[key]!)
    .filter(Boolean);
  if (parts.length === 0) return null;
  const label = parts.join(" | ");
  return label.length > 255 ? `${label.slice(0, 252)}…` : label;
}

export function pickPlayerFieldsForOrder(values: Record<string, string>): {
  playerFields: Prisma.InputJsonValue;
  playerLabel: string | null;
} {
  const cleaned = cleanPlayerFields(values);
  return {
    playerFields: cleaned as Prisma.InputJsonValue,
    playerLabel: buildPlayerLabel(cleaned),
  };
}
