import { allocateUniqueTransactionId } from "@/lib/transaction-id";
import {
  MemberLedgerDirection,
  MemberLedgerKind,
  OrderPaymentStatus,
  type Prisma,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { OrderPaymentStatusValue } from "@/lib/orders/order-status-labels";
import { ORDER_PAYMENT_STATUS_LABEL } from "@/lib/orders/order-status-labels";
import { MEMBER_DEPOSIT_PAGE_SIZE } from "@/lib/member/saldo-topup-constants";
import {
  extractPaymentInstructionsFromRaw,
  type PaymentInstructionGroup,
} from "@/lib/payments/payment-instructions";
import { sanitizePaymentBrandLabel } from "@/lib/payments/sanitize-payment-brand";

export {
  MEMBER_DEPOSIT_PAGE_SIZE,
  SALDO_TOPUP_MAX,
  SALDO_TOPUP_MIN,
  SALDO_TOPUP_PRESETS,
} from "@/lib/member/saldo-topup-constants";

export type { PaymentInstructionGroup };

export async function generateDepositCode(): Promise<string> {
  return allocateUniqueTransactionId();
}

export type MemberDepositListItem = {
  id: string;
  depositCode: string;
  amount: number;
  feeSnapshot: number;
  totalAmount: number;
  paymentStatus: OrderPaymentStatusValue;
  statusLabel: string;
  expiresAt: Date | null;
  createdAt: Date;
  channelName: string | null;
};

export async function listMemberDeposits(options: {
  memberId: string;
  skip?: number;
  take?: number;
}): Promise<{ deposits: MemberDepositListItem[]; total: number }> {
  const where = { memberId: options.memberId };

  const [rows, total] = await Promise.all([
    prisma.memberDeposit.findMany({
      where,
      skip: options.skip ?? 0,
      take: options.take ?? MEMBER_DEPOSIT_PAGE_SIZE,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        depositCode: true,
        amount: true,
        feeSnapshot: true,
        totalAmount: true,
        paymentStatus: true,
        expiresAt: true,
        createdAt: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { channelName: true, channel: true },
        },
      },
    }),
    prisma.memberDeposit.count({ where }),
  ]);

  return {
    total,
    deposits: rows.map((row) => {
      const status = row.paymentStatus as OrderPaymentStatusValue;
      const pay = row.payments[0];
      return {
        id: row.id,
        depositCode: row.depositCode,
        amount: row.amount,
        feeSnapshot: row.feeSnapshot,
        totalAmount: row.totalAmount,
        paymentStatus: status,
        statusLabel: ORDER_PAYMENT_STATUS_LABEL[status],
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
        channelName: pay
          ? sanitizePaymentBrandLabel(pay.channelName || pay.channel) || null
          : null,
      };
    }),
  };
}

export type PublicDepositInvoiceDto = {
  depositCode: string;
  amount: number;
  feeSnapshot: number;
  totalAmount: number;
  paymentStatus: OrderPaymentStatusValue;
  statusLabel: string;
  createdAt: string;
  expiresAt: string | null;
  saldoAfter?: number | null;
  payment: {
    channel: string;
    channelName: string | null;
    payCode: string | null;
    qrUrl: string | null;
    checkoutUrl: string | null;
    expiredAt: string | null;
    instructions: PaymentInstructionGroup[];
  } | null;
};

export async function getMemberDepositByCode(options: {
  depositCode: string;
  memberId: string;
}): Promise<PublicDepositInvoiceDto | null> {
  const depositCode = options.depositCode.trim();
  if (!depositCode) return null;

  const deposit = await prisma.memberDeposit.findFirst({
    where: {
      depositCode,
      memberId: options.memberId,
    },
    include: {
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
          rawCreateResponse: true,
        },
      },
      member: {
        select: {
          balance: { select: { saldo: true } },
        },
      },
    },
  });

  if (!deposit) return null;

  const status = deposit.paymentStatus as OrderPaymentStatusValue;
  const pay = deposit.payments[0] ?? null;

  return {
    depositCode: deposit.depositCode,
    amount: deposit.amount,
    feeSnapshot: deposit.feeSnapshot,
    totalAmount: deposit.totalAmount,
    paymentStatus: status,
    statusLabel:
      status === "UNPAID"
        ? "Menunggu pembayaran"
        : status === "PAID"
          ? "Saldo berhasil ditambahkan"
          : ORDER_PAYMENT_STATUS_LABEL[status],
    createdAt: deposit.createdAt.toISOString(),
    expiresAt: deposit.expiresAt?.toISOString() ?? null,
    saldoAfter: status === "PAID" ? (deposit.member.balance?.saldo ?? null) : null,
    payment: pay
      ? {
          channel: pay.channel,
          channelName: sanitizePaymentBrandLabel(pay.channelName || pay.channel),
          payCode: pay.payCode,
          qrUrl: pay.qrUrl,
          checkoutUrl: pay.checkoutUrl,
          expiredAt: pay.expiredAt?.toISOString() ?? null,
          instructions: extractPaymentInstructionsFromRaw(pay.rawCreateResponse),
        }
      : null,
  };
}

/**
 * Idempotent: UNPAID → PAID + CREDIT saldo sebesar deposit.amount.
 * Dipanggil dari notifikasi DOKU cabang deposit.
 */
export async function completePaidMemberDeposit(options: {
  paymentId: string;
  depositId: string;
  memberId: string;
  creditAmount: number;
  depositCode: string;
  callbackJson: Prisma.InputJsonValue;
}): Promise<{ credited: boolean }> {
  await getOrCreateBalanceInTx(options.memberId);

  return prisma.$transaction(async (tx) => {
    const payUpdated = await tx.payment.updateMany({
      where: {
        id: options.paymentId,
        status: OrderPaymentStatus.UNPAID,
      },
      data: {
        status: OrderPaymentStatus.PAID,
        paidAt: new Date(),
        rawCallback: options.callbackJson,
      },
    });

    if (payUpdated.count === 0) {
      await tx.payment.update({
        where: { id: options.paymentId },
        data: { rawCallback: options.callbackJson },
      });
      return { credited: false };
    }

    const depUpdated = await tx.memberDeposit.updateMany({
      where: {
        id: options.depositId,
        paymentStatus: OrderPaymentStatus.UNPAID,
      },
      data: { paymentStatus: OrderPaymentStatus.PAID },
    });

    if (depUpdated.count === 0) {
      return { credited: false };
    }

    const balance = await tx.memberBalance.update({
      where: { memberId: options.memberId },
      data: { saldo: { increment: options.creditAmount } },
    });
    const next = balance.saldo;

    await tx.memberLedgerEntry.create({
      data: {
        memberId: options.memberId,
        kind: MemberLedgerKind.SALDO,
        direction: MemberLedgerDirection.CREDIT,
        amount: options.creditAmount,
        balanceAfter: next,
        reason: `Topup saldo ${options.depositCode}`,
      },
    });

    return { credited: true };
  });
}

export async function syncMemberDepositPaymentStatus(options: {
  paymentId: string;
  depositId: string;
  nextStatus: typeof OrderPaymentStatus.EXPIRED | typeof OrderPaymentStatus.FAILED;
  callbackJson: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: {
        id: options.paymentId,
        status: OrderPaymentStatus.UNPAID,
      },
      data: {
        status: options.nextStatus,
        rawCallback: options.callbackJson,
      },
    });

    await tx.memberDeposit.updateMany({
      where: {
        id: options.depositId,
        paymentStatus: OrderPaymentStatus.UNPAID,
      },
      data: { paymentStatus: options.nextStatus },
    });
  });
}

async function getOrCreateBalanceInTx(memberId: string) {
  const existing = await prisma.memberBalance.findUnique({
    where: { memberId },
    select: { id: true },
  });
  if (existing) return;
  try {
    await prisma.memberBalance.create({
      data: { memberId, saldo: 0, poin: 0 },
    });
  } catch {
    // race — ok
  }
}
