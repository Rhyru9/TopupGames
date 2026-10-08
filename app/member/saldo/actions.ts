"use server";

import { redirect } from "next/navigation";
import { createSaldoTopupWithDoku } from "@/lib/member/create-saldo-topup";
import { getMemberSession } from "@/lib/member-auth";
import { listConfiguredDokuChannels } from "@/lib/payments/doku";
import { listDokuChannelsWithFees } from "@/lib/payments/doku-channels";
import { prisma } from "@/lib/prisma";
import {
  SALDO_TOPUP_MAX,
  SALDO_TOPUP_MIN,
} from "@/lib/member/saldo-topup-constants";

export type SaldoTopupActionState = {
  error?: string;
};

export async function getSaldoTopupPaymentOptions(amount: number) {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Silakan login dulu.", channels: [] };
  }

  const nominal = Math.trunc(amount);
  if (!Number.isFinite(nominal) || nominal < SALDO_TOPUP_MIN) {
    return {
      ok: false as const,
      error: `Nominal minimal Rp${SALDO_TOPUP_MIN.toLocaleString("id-ID")}.`,
      channels: [],
    };
  }
  if (nominal > SALDO_TOPUP_MAX) {
    return {
      ok: false as const,
      error: `Nominal maksimal Rp${SALDO_TOPUP_MAX.toLocaleString("id-ID")}.`,
      channels: [],
    };
  }

  const listed = await listConfiguredDokuChannels();
  if (!listed.ok) {
    return { ok: false as const, error: listed.error, channels: [] };
  }
  return { ok: true as const, error: null, channels: listDokuChannelsWithFees(nominal) };
}

export async function submitSaldoTopup(
  _prev: SaldoTopupActionState,
  formData: FormData,
): Promise<SaldoTopupActionState> {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    return { error: "Silakan login dulu." };
  }

  const amount = Math.trunc(Number(formData.get("amount")));
  const paymentChannel = String(formData.get("paymentChannel") ?? "").trim();

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, whatsapp: true },
  });
  if (!member) {
    return { error: "Sesi member tidak valid." };
  }

  const result = await createSaldoTopupWithDoku({
    memberId: member.id,
    amount,
    paymentChannel,
    memberName: member.name,
    memberEmail: member.email,
    memberWhatsapp: member.whatsapp,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(`/member/saldo/bayar/${result.depositCode}`);
}
