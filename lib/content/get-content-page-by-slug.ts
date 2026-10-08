import { prisma } from "@/lib/prisma";

export type PublicContentPage = {
  slug: string;
  title: string;
  content: string;
  updatedAt: Date;
};

export async function getContentPageBySlug(slug: string): Promise<PublicContentPage | null> {
  const row = await prisma.contentPage.findFirst({
    where: { slug, isActive: true },
    select: {
      slug: true,
      title: true,
      content: true,
      updatedAt: true,
    },
  });

  return row;
}
