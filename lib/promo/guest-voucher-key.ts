import { createHash } from "node:crypto";
import {
  buildCustomerNo,
  resolveGameInputFields,
} from "@/lib/catalog-products/game-input-fields";
import { cleanPlayerFields } from "@/lib/orders/player-fields";
import { normalizeEmail } from "@/lib/orders/order-helpers";

/** Target top-up dari input akun (userId, zone, format produk, dll.). */
export function buildVoucherTargetKey(
  accountValues: Record<string, string>,
  productInputFields: unknown,
  requiresZone: boolean,
): string | null {
  const config = resolveGameInputFields(productInputFields, requiresZone);
  const cleaned = cleanPlayerFields(accountValues);
  const target = buildCustomerNo(cleaned, config).trim();
  return target || null;
}

/** Fingerprint pemakaian voucher: email checkout + akun tujuan. */
export function buildVoucherUserKey(email: string, targetKey: string): string | null {
  const normalizedEmail = normalizeEmail(email) ?? "";
  const normalizedTarget = targetKey.trim();
  if (!normalizedEmail || !normalizedTarget) return null;
  return createHash("sha256")
    .update(`${normalizedEmail}|${normalizedTarget}`)
    .digest("hex");
}

/** @deprecated Pakai buildVoucherUserKey(email, targetKey). */
export function buildGuestVoucherKey(email: string, whatsapp: string): string | null {
  void whatsapp;
  const normalizedEmail = normalizeEmail(email) ?? "";
  if (!normalizedEmail) return null;
  return createHash("sha256").update(normalizedEmail).digest("hex");
}
