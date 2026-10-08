import { prisma } from "@/lib/prisma";
import type { ContentPageFormInput, ContentPageFormState, ContentPageListItem } from "@/lib/content/content-page-form";

export type {
  ContentPageFormInput,
  ContentPageFormState,
  ContentPageListItem,
} from "@/lib/content/content-page-form";
export { parseContentPageForm, slugifyContentPageTitle, validateContentPageInput } from "@/lib/content/content-page-form";

export async function validateContentPageSlugUnique(
  slug: string,
  excludeId?: string,
): Promise<string | null> {
  const existing = await prisma.contentPage.findUnique({ where: { slug } });
  if (!existing) return null;
  if (excludeId && existing.id === excludeId) return null;
  return "Slug sudah dipakai halaman lain.";
}

export async function listContentPages(options?: {
  skip?: number;
  take?: number;
}): Promise<{ items: ContentPageListItem[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.contentPage.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        sortOrder: true,
        isActive: true,
        showInFooter: true,
        updatedAt: true,
      },
    }),
    prisma.contentPage.count(),
  ]);

  return { items, total };
}

export async function persistContentPage(
  input: ContentPageFormInput,
  pageId?: string,
): Promise<ContentPageFormState | null> {
  const slugError = await validateContentPageSlugUnique(input.slug, pageId);
  if (slugError) {
    return { fieldErrors: { slug: slugError } };
  }

  if (pageId) {
    const existing = await prisma.contentPage.findUnique({ where: { id: pageId } });
    if (!existing) {
      return { error: "Halaman tidak ditemukan." };
    }

    await prisma.contentPage.update({
      where: { id: pageId },
      data: input,
    });
  } else {
    await prisma.contentPage.create({ data: input });
  }

  return null;
}

export async function deleteContentPageById(pageId: string): Promise<void> {
  await prisma.contentPage.delete({ where: { id: pageId } }).catch(() => null);
}
