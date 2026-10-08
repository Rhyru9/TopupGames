import { prisma } from "@/lib/prisma";
import type { ArticleFormInput, ArticleFormState, ArticleListItem } from "@/lib/article/article-form";
import { toArticlePersistData } from "@/lib/article/article-form";

export type {
  ArticleFormInput,
  ArticleFormState,
  ArticleListItem,
  PublicArticleCard,
  PublicArticleDetail,
} from "@/lib/article/article-form";
export {
  parseArticleForm,
  slugifyArticleTitle,
  validateArticleInput,
  formatPublishedAtInput,
} from "@/lib/article/article-form";

export async function validateArticleSlugUnique(
  slug: string,
  excludeId?: string,
): Promise<string | null> {
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) return null;
  if (excludeId && existing.id === excludeId) return null;
  return "Slug sudah dipakai artikel lain.";
}

export async function listArticles(options?: {
  skip?: number;
  take?: number;
}): Promise<{ items: ArticleListItem[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    prisma.article.count(),
  ]);

  return { items, total };
}

export async function persistArticle(
  input: ArticleFormInput,
  articleId?: string,
): Promise<ArticleFormState | null> {
  const slugError = await validateArticleSlugUnique(input.slug, articleId);
  if (slugError) {
    return { fieldErrors: { slug: slugError } };
  }

  const data = toArticlePersistData(input);

  if (articleId) {
    const existing = await prisma.article.findUnique({ where: { id: articleId } });
    if (!existing) {
      return { error: "Artikel tidak ditemukan." };
    }

    await prisma.article.update({
      where: { id: articleId },
      data,
    });
  } else {
    await prisma.article.create({ data });
  }

  return null;
}

export async function deleteArticleById(articleId: string): Promise<void> {
  await prisma.article.delete({ where: { id: articleId } }).catch(() => null);
}
