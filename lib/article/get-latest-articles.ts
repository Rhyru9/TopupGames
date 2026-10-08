import { prisma } from "@/lib/prisma";
import type { PublicArticleCard } from "@/lib/article/article-form";

const publicArticleSelect = {
  slug: true,
  title: true,
  excerpt: true,
  coverImageUrl: true,
  coverImageAlt: true,
  publishedAt: true,
  authorName: true,
} as const;

function publishedWhere(now = new Date()) {
  return {
    isActive: true,
    publishedAt: { lte: now },
  };
}

export async function getLatestArticles(limit = 6): Promise<PublicArticleCard[]> {
  return prisma.article.findMany({
    where: publishedWhere(),
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: publicArticleSelect,
  });
}

export async function getActiveArticleSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.article.findMany({
    where: publishedWhere(),
    orderBy: { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  });
}

export async function getRelatedArticles(
  excludeSlug: string,
  limit = 5,
): Promise<PublicArticleCard[]> {
  return prisma.article.findMany({
    where: {
      ...publishedWhere(),
      slug: { not: excludeSlug },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: publicArticleSelect,
  });
}
