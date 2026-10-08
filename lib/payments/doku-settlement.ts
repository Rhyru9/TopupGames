import { OrderPaymentStatus, type Prisma } from "@/app/generated/prisma/client";
import { getDokuChannel } from "@/lib/payments/doku-channels";
import type { DokuCreatePaymentData } from "@/lib/payments/doku";
import { prisma } from "@/lib/prisma";

export type DokuSettledInvoice = {
  reference: string;
  channelName: string;
  paidAmount: number;
  feeSnapshot: number;
  expiredAt: Date;
  payCode: string | null;
  qrUrl: string | null;
  checkoutUrl: string | null;
};

export function settleDokuCreateResponse(
  data: DokuCreatePaymentData,
  subtotal: number,
  method: string,
): DokuSettledInvoice | { error: string } {
  const reference = String(data.invoice_number ?? "").trim();
  if (!reference) {
    return { error: "DOKU tidak mengembalikan invoice number." };
  }

  const base = Math.max(0, Math.trunc(subtotal));
  const paidAmount = Math.trunc(Number(data.amount));
  const amount = Number.isFinite(paidAmount) && paidAmount > 0 ? paidAmount : base;

  const expiredAt =
    typeof data.expired_time === "number"
      ? new Date(data.expired_time * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    reference,
    channelName: getDokuChannel(method)?.name || method,
    paidAmount: amount,
    feeSnapshot: Math.max(0, amount - base),
    expiredAt,
    payCode: null,
    qrUrl: null,
    checkoutUrl: data.payment_url?.trim() || null,
  };
}

export async function persistDokuPayment(input: {
  orderId?: string | null;
  memberDepositId?: string | null;
  channel: string;
  data: DokuCreatePaymentData;
  subtotal: number;
}): Promise<DokuSettledInvoice | { error: string }> {
  const settled = settleDokuCreateResponse(input.data, input.subtotal, input.channel);
  if ("error" in settled) return settled;

  try {
    await prisma.payment.create({
      data: {
        orderId: input.orderId ?? null,
        memberDepositId: input.memberDepositId ?? null,
        provider: "doku",
        channel: input.channel,
        channelName: settled.channelName,
        reference: settled.reference,
        amount: settled.paidAmount,
        checkoutUrl: settled.checkoutUrl,
        payCode: settled.payCode,
        qrUrl: settled.qrUrl,
        status: OrderPaymentStatus.UNPAID,
        expiredAt: settled.expiredAt,
        rawCreateResponse: input.data as Prisma.InputJsonValue,
      },
    });
  } catch {
    const existing = await prisma.payment.findUnique({
      where: { reference: settled.reference },
      select: { id: true },
    });
    if (!existing) {
      return { error: "Gagal menyimpan invoice pembayaran." };
    }
  }

  return settled;
}
