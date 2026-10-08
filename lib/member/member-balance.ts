import { prisma } from "@/lib/prisma";

export type MemberBalanceRow = {
  id: string;
  memberId: string;
  saldo: number;
  poin: number;
};

/** Ambil atau buat baris saldo/poin (default 0). */
export async function getOrCreateMemberBalance(
  memberId: string,
): Promise<MemberBalanceRow> {
  const existing = await prisma.memberBalance.findUnique({
    where: { memberId },
    select: { id: true, memberId: true, saldo: true, poin: true },
  });
  if (existing) return existing;

  try {
    return await prisma.memberBalance.create({
      data: { memberId, saldo: 0, poin: 0 },
      select: { id: true, memberId: true, saldo: true, poin: true },
    });
  } catch {
    // Race: baris sudah dibuat di request lain.
    const again = await prisma.memberBalance.findUnique({
      where: { memberId },
      select: { id: true, memberId: true, saldo: true, poin: true },
    });
    if (again) return again;
    throw new Error(`Gagal membuat balance untuk member ${memberId}`);
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPoin(poin: number): string {
  return new Intl.NumberFormat("id-ID").format(poin);
}
