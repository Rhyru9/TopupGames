import { prisma } from "@/lib/prisma";
import type { PublicArticleCard } from "@/lib/article/article-form";

export async function getActiveArticles(options?: {
  skip?: number;
  take?: number;
}): Promise<{ items: PublicArticleCard[]; total: number }> {
  const now = new Date();
  const where = {
    isActive: true,
    publishedAt: { lte: now },
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        coverImageAlt: true,
        publishedAt: true,
        authorName: true,
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { items, total };
}
