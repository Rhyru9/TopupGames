"use server";

import { grantInvoiceAccess } from "@/lib/orders/invoice-access";
import { allowCekTransaksiAttempt, lookupClientIp } from "@/lib/orders/lookup-rate-limit";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createOrderWithDoku } from "@/lib/orders/create-order";
import {
  normalizeEmail,
  toPublicInvoiceDto,
  type PublicInvoiceDto,
} from "@/lib/orders/order-helpers";
import { listConfiguredDokuChannels } from "@/lib/payments/doku";
import { loadCheckoutPaymentOptions } from "@/lib/orders/checkout-payment-options";
import { getMemberSession } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

export type CheckoutActionState = {
  error?: string;
};

export async function getPublicPaymentChannels() {
  const result = await listConfiguredDokuChannels();
  if (!result.ok) {
    return { ok: false as const, error: result.error, channels: [] };
  }
  return { ok: true as const, error: null, channels: result.channels };
}

export async function getCheckoutPaymentOptions(input: {
  productId: string;
  productSkuId: string;
  usePoin?: boolean;
  voucherCode?: string;
  email?: string;
  accountValues?: Record<string, string>;
}) {
  const productId = input.productId.trim();
  const productSkuId = input.productSkuId.trim();
  if (!productId || !productSkuId) {
    return { ok: false as const, error: "Data pesanan tidak valid.", data: null };
  }

  const result = await loadCheckoutPaymentOptions({
    productId,
    productSkuId,
    usePoin: Boolean(input.usePoin),
    voucherCode: input.voucherCode?.trim() || undefined,
    email: input.email?.trim() || undefined,
    accountValues: input.accountValues,
  });
  if (!result.ok) {
    return { ok: false as const, error: result.error, data: null };
  }
  return { ok: true as const, error: null, data: result.data };
}

export async function submitCheckout(
  _prev: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const productSkuId = String(formData.get("productSkuId") ?? "").trim();
  const paymentChannel = String(formData.get("paymentChannel") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const usePoin = String(formData.get("usePoin") ?? "") === "1";
  const useSaldo = String(formData.get("useSaldo") ?? "") === "1";
  const voucherCode = String(formData.get("voucherCode") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();

  // Ignore any client-supplied amount/price — never trust.
  void formData.get("amount");
  void formData.get("price");

  let accountValues: Record<string, string> = {};
  const rawValues = String(formData.get("accountValues") ?? "").trim();
  if (rawValues) {
    try {
      const parsed = JSON.parse(rawValues) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        accountValues = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v ?? ""),
          ]),
        );
      }
    } catch {
      return { error: "Data akun tidak valid." };
    }
  }

  if (!productId || !productSkuId) {
    return { error: "Produk atau nominal tidak valid." };
  }

  const memberSession = await getMemberSession();
  const memberId = memberSession?.user?.id ?? null;

  const result = await createOrderWithDoku({
    idempotencyKey,
    productId,
    productSkuId,
    paymentChannel,
    accountValues,
    email,
    whatsapp,
    nickname,
    memberId,
    isMember: Boolean(memberId),
    usePoin,
    useSaldo,
    voucherCode: voucherCode || undefined,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  await grantInvoiceAccess(result.orderCode);
  redirect(`/invoice/${result.orderCode}`);
}

export async function lookupOrderByContact(input: {
  orderCode: string;
  email?: string;
  whatsapp?: string;
}): Promise<{ ok: true; invoice: PublicInvoiceDto } | { ok: false; error: string }> {
  const hdrs = await headers();
  const ip = lookupClientIp(hdrs);

  if (!(await allowCekTransaksiAttempt(ip))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi sebentar." };
  }

  const orderCode = input.orderCode.trim();
  const email = normalizeEmail(input.email ?? "");
  if (!orderCode || !email) {
    return { ok: false, error: "Transaksi tidak ditemukan." };
  }

  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      product: { select: { slug: true } },
      wallet: { select: { poinUsed: true, saldoUsed: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          channel: true,
          channelName: true,
          payCode: true,
          qrUrl: true,
          checkoutUrl: true,
          expiredAt: true,
          paidAt: true,
          createdAt: true,
          rawCreateResponse: true,
        },
      },
    },
  });

  if (!order || order.email?.trim().toLowerCase() !== email) {
    return { ok: false, error: "Transaksi tidak ditemukan." };
  }

  await grantInvoiceAccess(order.orderCode);
  return { ok: true, invoice: toPublicInvoiceDto(order) };
}

export async function unlockInvoice(_prev: CheckoutActionState, formData: FormData): Promise<CheckoutActionState> {
  const orderCode = String(formData.get("orderCode") ?? "").trim();
  const result = await lookupOrderByContact({ orderCode, email: String(formData.get("email") ?? "") });
  if (!result.ok) return { error: result.error };
  redirect(`/invoice/${encodeURIComponent(result.invoice.orderCode)}`);
}
