import { prisma } from "@/lib/prisma";
import type { PublicArticleDetail } from "@/lib/article/article-form";

export async function getArticleBySlug(slug: string): Promise<PublicArticleDetail | null> {
  const now = new Date();
  const row = await prisma.article.findFirst({
    where: {
      slug,
      isActive: true,
      publishedAt: { lte: now },
    },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      coverImageUrl: true,
      coverImageAlt: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImageUrl: true,
      authorName: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return row;
}
