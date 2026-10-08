import { prisma } from "@/lib/prisma";

export type FooterContentPageLink = {
  slug: string;
  title: string;
};

export async function getFooterContentPages(): Promise<FooterContentPageLink[]> {
  const rows = await prisma.contentPage.findMany({
    where: { isActive: true, showInFooter: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { slug: true, title: true },
  });

  return rows;
}
