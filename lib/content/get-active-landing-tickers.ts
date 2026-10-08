import { prisma } from "@/lib/prisma";

export type LandingTickerItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
};

/** Item ticker aktif untuk beranda, urut naik. */
export async function getActiveLandingTickers(): Promise<LandingTickerItem[]> {
  const rows = await prisma.tickerItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      label: true,
      detail: true,
      href: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    detail: row.detail,
    href: row.href.trim(),
  }));
}
