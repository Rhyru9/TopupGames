import {
  MemberLedgerDirection,
  MemberLedgerKind,
  type Prisma,
} from "@/app/generated/prisma/client";
import { getOrCreateMemberBalance } from "@/lib/member/member-balance";
import { prisma } from "@/lib/prisma";

export type MemberLedgerKindValue = "SALDO" | "POIN";
export type MemberLedgerDirectionValue = "CREDIT" | "DEBIT";

export type ApplyMemberLedgerInput = {
  memberId: string;
  kind: MemberLedgerKindValue;
  direction: MemberLedgerDirectionValue;
  amount: number;
  reason: string;
  adminId?: string | null;
};

export type ApplyMemberLedgerResult =
  | { ok: true; balanceAfter: number; saldo: number; poin: number }
  | { ok: false; error: string };

export async function applyMemberLedgerAdjustment(
  input: ApplyMemberLedgerInput,
): Promise<ApplyMemberLedgerResult> {
  const amount = Math.trunc(input.amount);
  const reason = input.reason.trim();

  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, error: "Jumlah minimal 1." };
  }
  if (reason.length < 3) {
    return { ok: false, error: "Alasan wajib diisi (minimal 3 karakter)." };
  }

  const member = await prisma.member.findUnique({
    where: { id: input.memberId },
    select: { id: true },
  });
  if (!member) {
    return { ok: false, error: "Member tidak ditemukan." };
  }

  await getOrCreateMemberBalance(input.memberId);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const field = input.kind === "SALDO" ? "saldo" : "poin";
      const mutation = input.direction === "CREDIT" ? { increment: amount } : { decrement: amount };
      const claimed = await tx.memberBalance.updateMany({
        where: {
          memberId: input.memberId,
          ...(input.direction === "DEBIT" ? { [field]: { gte: amount } } : {}),
        },
        data: { [field]: mutation },
      });
      if (claimed.count !== 1) throw new Error("INSUFFICIENT");
      const updated = await tx.memberBalance.findUniqueOrThrow({ where: { memberId: input.memberId } });
      const next = updated[field];

      await tx.memberLedgerEntry.create({
        data: {
          memberId: input.memberId,
          kind: input.kind as MemberLedgerKind,
          direction: input.direction as MemberLedgerDirection,
          amount,
          balanceAfter: next,
          reason,
          createdByAdminId: input.adminId ?? null,
        },
      });

      return {
        balanceAfter: next,
        saldo: updated.saldo,
        poin: updated.poin,
      };
    });

    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT") {
        return {
          ok: false,
          error:
            input.kind === "SALDO"
              ? "Saldo tidak cukup untuk dikurangi."
              : "Poin tidak cukup untuk dikurangi.",
        };
      }
      if (error.message === "BALANCE_MISSING") {
        return { ok: false, error: "Saldo member belum tersedia." };
      }
    }
    console.error("[member-ledger] apply", error);
    return { ok: false, error: "Gagal menyimpan mutasi." };
  }
}

export type MemberBalanceListItem = {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  image: string | null;
  isActive: boolean;
  status: string;
  saldo: number;
  poin: number;
};

export async function listMembersWithBalances(options: {
  q?: string;
  skip?: number;
  take?: number;
}): Promise<{ members: MemberBalanceListItem[]; total: number }> {
  const q = options.q?.trim();
  const where: Prisma.MemberWhereInput = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { whatsapp: { contains: q } },
          { memberCode: { contains: q.toUpperCase() } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip: options.skip ?? 0,
      take: options.take ?? 15,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        memberCode: true,
        name: true,
        email: true,
        image: true,
        isActive: true,
        status: true,
        balance: { select: { saldo: true, poin: true } },
      },
    }),
    prisma.member.count({ where }),
  ]);

  return {
    total,
    members: rows.map((row) => ({
      id: row.id,
      memberCode: row.memberCode,
      name: row.name,
      email: row.email,
      image: row.image,
      isActive: row.isActive,
      status: row.status,
      saldo: row.balance?.saldo ?? 0,
      poin: row.balance?.poin ?? 0,
    })),
  };
}

export type MemberLedgerListItem = {
  id: string;
  kind: MemberLedgerKindValue;
  direction: MemberLedgerDirectionValue;
  amount: number;
  /** Saldo/poin sebelum mutasi (derived). */
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  createdByAdminId: string | null;
  createdAt: Date;
};

export function getLedgerBalanceBefore(entry: {
  direction: MemberLedgerDirectionValue;
  amount: number;
  balanceAfter: number;
}): number {
  return entry.direction === "CREDIT"
    ? entry.balanceAfter - entry.amount
    : entry.balanceAfter + entry.amount;
}

export async function listMemberLedgerEntries(options: {
  memberId: string;
  kind?: MemberLedgerKindValue | "";
  skip?: number;
  take?: number;
}): Promise<{ entries: MemberLedgerListItem[]; total: number }> {
  const where: Prisma.MemberLedgerEntryWhereInput = {
    memberId: options.memberId,
    ...(options.kind === "SALDO" || options.kind === "POIN"
      ? { kind: options.kind as MemberLedgerKind }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.memberLedgerEntry.findMany({
      where,
      skip: options.skip ?? 0,
      take: options.take ?? 20,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        kind: true,
        direction: true,
        amount: true,
        balanceAfter: true,
        reason: true,
        createdByAdminId: true,
        createdAt: true,
      },
    }),
    prisma.memberLedgerEntry.count({ where }),
  ]);

  return {
    total,
    entries: rows.map((row) => {
      const direction = row.direction as MemberLedgerDirectionValue;
      const balanceAfter = row.balanceAfter;
      return {
        id: row.id,
        kind: row.kind as MemberLedgerKindValue,
        direction,
        amount: row.amount,
        balanceBefore: getLedgerBalanceBefore({
          direction,
          amount: row.amount,
          balanceAfter,
        }),
        balanceAfter,
        reason: row.reason,
        createdByAdminId: row.createdByAdminId,
        createdAt: row.createdAt,
      };
    }),
  };
}

/** Cari mutasi topup yang terkait kode deposit (reason: Topup saldo {code}). */
export async function findLedgerEntryByDepositCode(options: {
  memberId: string;
  depositCode: string;
}): Promise<MemberLedgerListItem | null> {
  const reason = `Topup saldo ${options.depositCode}`;
  const row = await prisma.memberLedgerEntry.findFirst({
    where: {
      memberId: options.memberId,
      kind: MemberLedgerKind.SALDO,
      reason,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      kind: true,
      direction: true,
      amount: true,
      balanceAfter: true,
      reason: true,
      createdByAdminId: true,
      createdAt: true,
    },
  });
  if (!row) return null;

  const direction = row.direction as MemberLedgerDirectionValue;
  return {
    id: row.id,
    kind: row.kind as MemberLedgerKindValue,
    direction,
    amount: row.amount,
    balanceBefore: getLedgerBalanceBefore({
      direction,
      amount: row.amount,
      balanceAfter: row.balanceAfter,
    }),
    balanceAfter: row.balanceAfter,
    reason: row.reason,
    createdByAdminId: row.createdByAdminId,
    createdAt: row.createdAt,
  };
}
