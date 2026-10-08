import { MemberStatus, type Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isMemberStatusActive,
  isMemberStatusValue,
  type MemberStatusValue,
} from "@/lib/member/member-status";

export type MemberListFilters = {
  q?: string;
  status?: MemberStatusValue | "inactive" | "";
};

export type MemberListItem = {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  whatsapp: string | null;
  image: string | null;
  hasGoogle: boolean;
  hasPassword: boolean;
  emailVerified: Date | null;
  isActive: boolean;
  status: MemberStatusValue;
  statusReason: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  saldo: number;
  poin: number;
};

export function buildMemberWhere(filters: MemberListFilters): Prisma.MemberWhereInput {
  const q = filters.q?.trim();
  const status = filters.status;

  return {
    ...(status && isMemberStatusValue(status) ? { status: status as MemberStatus } : {}),
    ...(status === "inactive" ? { status: { not: MemberStatus.ACTIVE } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { whatsapp: { contains: q } },
            { memberCode: { contains: q.toUpperCase() } },
          ],
        }
      : {}),
  };
}

export async function listMembers(options: {
  filters?: MemberListFilters;
  skip?: number;
  take?: number;
}): Promise<{ members: MemberListItem[]; total: number }> {
  const filters = options.filters ?? {};
  const where = buildMemberWhere(filters);

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
        whatsapp: true,
        image: true,
        googleId: true,
        passwordHash: true,
        emailVerified: true,
        isActive: true,
        status: true,
        statusReason: true,
        lastLoginAt: true,
        createdAt: true,
        balance: { select: { saldo: true, poin: true } },
      },
    }),
    prisma.member.count({ where }),
  ]);

  const members: MemberListItem[] = rows.map((row) => ({
    id: row.id,
    memberCode: row.memberCode,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    image: row.image,
    hasGoogle: Boolean(row.googleId),
    hasPassword: Boolean(row.passwordHash),
    emailVerified: row.emailVerified,
    isActive: row.isActive && isMemberStatusActive(row.status),
    status: row.status as MemberStatusValue,
    statusReason: row.statusReason,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    saldo: row.balance?.saldo ?? 0,
    poin: row.balance?.poin ?? 0,
  }));

  return { members, total };
}

export async function getMemberForAdmin(id: string) {
  return prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      memberCode: true,
      name: true,
      email: true,
      whatsapp: true,
      image: true,
      googleId: true,
      emailVerified: true,
      isActive: true,
      status: true,
      statusReason: true,
      statusAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      balance: { select: { saldo: true, poin: true } },
    },
  });
}
