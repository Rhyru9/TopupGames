import { prisma } from "@/lib/prisma";
import { normalizeMemberCodeQuery } from "@/lib/member/member-code";

export type MemberLinkSearchResult = {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  whatsapp: string | null;
  saldo: number;
};

/**
 * Cari member untuk kaitkan order guest (console).
 * Min 2 karakter — hanya ID member (CUS…).
 */
export async function searchMembersForOrderLink(
  query: string,
  limit = 8,
): Promise<MemberLinkSearchResult[]> {
  const raw = query.trim();
  if (raw.length < 2) return [];

  const code = normalizeMemberCodeQuery(raw);
  const rows = await prisma.member.findMany({
    where: { memberCode: { contains: code } },
    orderBy: [{ memberCode: "asc" }],
    take: Math.min(limit, 12),
    select: {
      id: true,
      memberCode: true,
      name: true,
      email: true,
      whatsapp: true,
      balance: { select: { saldo: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    memberCode: row.memberCode,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    saldo: row.balance?.saldo ?? 0,
  }));
}

export async function resolveMemberForOrderLink(
  memberId: string,
  memberQuery: string,
): Promise<MemberLinkSearchResult | null> {
  const id = memberId.trim();
  if (id) return getMemberForOrderLink(id);

  const raw = memberQuery.trim();
  if (!raw) return null;

  const code = normalizeMemberCodeQuery(raw);
  const row = await prisma.member.findFirst({
    where: {
      OR: [{ memberCode: code }, { id: raw }],
    },
    select: {
      id: true,
      memberCode: true,
      name: true,
      email: true,
      whatsapp: true,
      balance: { select: { saldo: true } },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    memberCode: row.memberCode,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    saldo: row.balance?.saldo ?? 0,
  };
}

export async function getMemberForOrderLink(
  memberId: string,
): Promise<MemberLinkSearchResult | null> {
  const id = memberId.trim();
  if (!id) return null;

  const row = await prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      memberCode: true,
      name: true,
      email: true,
      whatsapp: true,
      balance: { select: { saldo: true } },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    memberCode: row.memberCode,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    saldo: row.balance?.saldo ?? 0,
  };
}
