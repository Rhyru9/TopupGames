"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  deleteArticleById,
  parseArticleForm,
  persistArticle,
  validateArticleInput,
  type ArticleFormState,
} from "@/lib/article/article-mutations";
import { articleToasts } from "@/lib/article/article-toasts";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { ArticleFormState };

function revalidateArticlePaths(slug?: string) {
  revalidatePath("/console/artikel");
  revalidatePath("/artikel");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/artikel/${slug}`);
  }
}

export async function saveArticle(
  _prevState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const articleId = String(formData.get("articleId") ?? "").trim() || undefined;
  const input = parseArticleForm(formData);
  const validation = validateArticleInput(input, { excludeId: articleId });
  if (validation) return validation;

  const result = await persistArticle(input, articleId);
  if (result) return result;

  revalidateArticlePaths(input.slug);
  redirect(
    withToastUrl(
      "/console/artikel",
      articleId ? articleToasts.updated : articleToasts.created,
    ),
  );
}

export async function deleteArticle(formData: FormData) {
  await guardConsoleAdminAction();
  const articleId = String(formData.get("articleId") ?? "").trim();
  if (!articleId) return;

  const row = await prisma.article.findUnique({
    where: { id: articleId },
    select: { slug: true },
  });

  await deleteArticleById(articleId);

  revalidateArticlePaths(row?.slug);
  redirect(withToastUrl("/console/artikel", articleToasts.deleted));
}

export async function toggleArticleStatus(formData: FormData) {
  await guardConsoleAdminAction();
  const articleId = String(formData.get("articleId") ?? "").trim();
  if (!articleId) return;

  const row = await prisma.article.findUnique({ where: { id: articleId } });
  if (!row) return;

  await prisma.article.update({
    where: { id: articleId },
    data: { isActive: !row.isActive },
  });

  revalidateArticlePaths(row.slug);
  redirect(withToastUrl("/console/artikel", articleToasts.statusUpdated));
}
