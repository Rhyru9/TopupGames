import { OrderPaymentStatus } from "@/app/generated/prisma/client";
import { getAppUrl } from "@/lib/app-url";
import { generateDepositCode } from "@/lib/member/member-deposits";
import {
  SALDO_TOPUP_MAX,
  SALDO_TOPUP_MIN,
} from "@/lib/member/saldo-topup-constants";
import { prisma } from "@/lib/prisma";
import { createDokuCheckoutPayment, listConfiguredDokuChannels } from "@/lib/payments/doku";
import { persistDokuPayment } from "@/lib/payments/doku-settlement";
import { getPaymentGatewayConfig } from "@/lib/payments/get-payment-gateway-config";

export type CreateSaldoTopupInput = {
  memberId: string;
  amount: number;
  paymentChannel: string;
  memberName: string;
  memberEmail: string;
  memberWhatsapp?: string | null;
};

export type CreateSaldoTopupResult =
  | { ok: true; depositCode: string }
  | { ok: false; error: string };

export async function createSaldoTopupWithDoku(
  input: CreateSaldoTopupInput,
): Promise<CreateSaldoTopupResult> {
  const channel = input.paymentChannel.trim().toUpperCase();
  if (!channel) return { ok: false, error: "Pilih metode pembayaran." };

  const amount = Math.trunc(input.amount);
  if (!Number.isFinite(amount) || amount < SALDO_TOPUP_MIN) {
    return {
      ok: false,
      error: `Nominal minimal Rp${SALDO_TOPUP_MIN.toLocaleString("id-ID")}.`,
    };
  }
  if (amount > SALDO_TOPUP_MAX) {
    return {
      ok: false,
      error: `Nominal maksimal Rp${SALDO_TOPUP_MAX.toLocaleString("id-ID")}.`,
    };
  }

  const member = await prisma.member.findUnique({
    where: { id: input.memberId },
    select: { id: true, email: true, name: true, whatsapp: true },
  });
  if (!member) return { ok: false, error: "Sesi member tidak valid." };

  const listed = await listConfiguredDokuChannels();
  if (!listed.ok) return listed;
  if (!listed.channels.some((item) => item.code === channel)) {
    return { ok: false, error: "Metode pembayaran tidak tersedia." };
  }

  const gateway = await getPaymentGatewayConfig("doku");
  if (!gateway?.isConfigured) {
    return { ok: false, error: "Payment gateway belum aktif." };
  }

  const appUrl = await getAppUrl();

  const depositCode = await generateDepositCode();

  const deposit = await prisma.memberDeposit.create({
    data: {
      depositCode,
      memberId: member.id,
      amount,
      feeSnapshot: 0,
      totalAmount: amount,
      paymentStatus: OrderPaymentStatus.UNPAID,
    },
  });

  const customerName = member.name.trim() || member.email.split("@")[0] || "Member";
  const customerEmail = member.email;
  const customerPhone = member.whatsapp || input.memberWhatsapp || undefined;

  const doku = await createDokuCheckoutPayment({
    method: channel,
    merchantRef: deposit.depositCode,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    orderItemName: `Topup saldo ${deposit.depositCode}`,
    returnUrl: `${appUrl}/member/saldo/bayar/${deposit.depositCode}`,
    expiredMinutes: 1440,
  });

  if (!doku.ok) {
    await prisma.memberDeposit.update({
      where: { id: deposit.id },
      data: { paymentStatus: OrderPaymentStatus.FAILED },
    });
    console.error("[create-saldo-topup] doku failed", deposit.depositCode, doku.error);
    return { ok: false, error: doku.error || "Gagal membuat invoice pembayaran." };
  }

  const settled = await persistDokuPayment({
    memberDepositId: deposit.id,
    channel,
    data: doku.data,
    subtotal: amount,
  });
  if ("error" in settled) {
    await prisma.memberDeposit.update({
      where: { id: deposit.id },
      data: { paymentStatus: OrderPaymentStatus.FAILED },
    });
    console.error("[create-saldo-topup] persist payment failed", deposit.depositCode, settled.error);
    return { ok: false, error: "Gagal menyimpan invoice pembayaran. Coba lagi." };
  }

  await prisma.memberDeposit.update({
    where: { id: deposit.id },
    data: {
      feeSnapshot: settled.feeSnapshot,
      totalAmount: settled.paidAmount,
      expiresAt: settled.expiredAt,
    },
  });

  return { ok: true, depositCode: deposit.depositCode };
}
