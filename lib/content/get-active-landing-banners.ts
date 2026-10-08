import { prisma } from "@/lib/prisma";

export type LandingBannerSlide = {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
};

/** Banner aktif untuk slider beranda, urut naik. */
export async function getActiveLandingBanners(): Promise<LandingBannerSlide[]> {
  const rows = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      imageUrl: true,
      href: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    imageUrl: row.imageUrl,
    href: row.href.trim(),
  }));
}
