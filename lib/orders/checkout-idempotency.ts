import { createHash } from "node:crypto";
import type { CreateOrderInput } from "@/lib/orders/create-order";
import { normalizeEmail, normalizeWhatsapp } from "@/lib/orders/order-contact";
import { normalizeVoucherCode } from "@/lib/promo/voucher-shared";

export function checkoutIdentity(input: CreateOrderInput) {
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(input.idempotencyKey ?? "")) {
    throw new Error("Sesi checkout tidak valid. Ulangi dari halaman produk.");
  }
  const hash = (value: string) => createHash("sha256").update(value).digest("hex");
  return {
    checkoutKey: hash(input.idempotencyKey),
    checkoutFingerprint: hash(JSON.stringify({
      memberId: input.memberId ?? null,
      productId: input.productId,
      productSkuId: input.productSkuId,
      paymentChannel: input.paymentChannel.trim().toUpperCase(),
      email: normalizeEmail(input.email ?? ""),
      whatsapp: normalizeWhatsapp(input.whatsapp ?? ""),
      nickname: input.nickname?.trim() || null,
      accountValues: Object.entries(input.accountValues).sort(([a], [b]) => a.localeCompare(b)),
      usePoin: Boolean(input.usePoin),
      useSaldo: Boolean(input.useSaldo),
      voucherCode: normalizeVoucherCode(input.voucherCode ?? ""),
    })),
  };
}
