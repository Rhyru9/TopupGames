import { type OrderPaymentStatus, type Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminDepositListItem = {
  id: string;
  depositCode: string;
  amount: number;
  feeSnapshot: number;
  totalAmount: number;
  paymentStatus: OrderPaymentStatus;
  createdAt: Date;
  expiresAt: Date | null;
  channel: string | null;
  member: {
    id: string;
    name: string;
    email: string;
  };
};

export async function listAdminDeposits(options: {
  q?: string;
  paymentStatus?: OrderPaymentStatus | "";
  skip?: number;
  take?: number;
}): Promise<{ deposits: AdminDepositListItem[]; total: number }> {
  const q = options.q?.trim();
  const where: Prisma.MemberDepositWhereInput = {
    ...(options.paymentStatus ? { paymentStatus: options.paymentStatus } : {}),
    ...(q
      ? {
          OR: [
            { depositCode: { contains: q } },
            { member: { name: { contains: q } } },
            { member: { email: { contains: q } } },
            { member: { whatsapp: { contains: q } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.memberDeposit.findMany({
      where,
      skip: options.skip ?? 0,
      take: options.take ?? 15,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        depositCode: true,
        amount: true,
        feeSnapshot: true,
        totalAmount: true,
        paymentStatus: true,
        createdAt: true,
        expiresAt: true,
        member: {
          select: { id: true, name: true, email: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { channel: true, channelName: true },
        },
      },
    }),
    prisma.memberDeposit.count({ where }),
  ]);

  return {
    total,
    deposits: rows.map((row) => ({
      id: row.id,
      depositCode: row.depositCode,
      amount: row.amount,
      feeSnapshot: row.feeSnapshot,
      totalAmount: row.totalAmount,
      paymentStatus: row.paymentStatus,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      channel: row.payments[0]?.channelName || row.payments[0]?.channel || null,
      member: row.member,
    })),
  };
}

export async function getAdminDepositDetail(id: string) {
  return prisma.memberDeposit.findUnique({
    where: { id },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          email: true,
          whatsapp: true,
          balance: { select: { saldo: true, poin: true } },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
