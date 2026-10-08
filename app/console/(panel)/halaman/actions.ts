"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  deleteContentPageById,
  parseContentPageForm,
  persistContentPage,
  validateContentPageInput,
  type ContentPageFormState,
} from "@/lib/content/content-page-mutations";
import { contentPageToasts } from "@/lib/content/content-page-toasts";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { ContentPageFormState };

function revalidateContentPagePaths(slug?: string) {
  revalidatePath("/console/halaman");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/halaman/${slug}`);
  }
}

export async function saveContentPage(
  _prevState: ContentPageFormState,
  formData: FormData,
): Promise<ContentPageFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const pageId = String(formData.get("pageId") ?? "").trim() || undefined;
  const input = parseContentPageForm(formData);
  const validation = validateContentPageInput(input, { excludeId: pageId });
  if (validation) return validation;

  const result = await persistContentPage(input, pageId);
  if (result) return result;

  revalidateContentPagePaths(input.slug);
  redirect(
    withToastUrl(
      "/console/halaman",
      pageId ? contentPageToasts.updated : contentPageToasts.created,
    ),
  );
}

export async function deleteContentPage(formData: FormData) {
  await guardConsoleAdminAction();
  const pageId = String(formData.get("pageId") ?? "").trim();
  if (!pageId) return;

  const row = await prisma.contentPage.findUnique({
    where: { id: pageId },
    select: { slug: true },
  });

  await deleteContentPageById(pageId);

  revalidateContentPagePaths(row?.slug);
  redirect(withToastUrl("/console/halaman", contentPageToasts.deleted));
}

export async function toggleContentPageStatus(formData: FormData) {
  await guardConsoleAdminAction();
  const pageId = String(formData.get("pageId") ?? "").trim();
  if (!pageId) return;

  const row = await prisma.contentPage.findUnique({ where: { id: pageId } });
  if (!row) return;

  await prisma.contentPage.update({
    where: { id: pageId },
    data: { isActive: !row.isActive },
  });

  revalidateContentPagePaths(row.slug);
  redirect(withToastUrl("/console/halaman", contentPageToasts.statusUpdated));
}

export async function toggleContentPageFooter(formData: FormData) {
  await guardConsoleAdminAction();
  const pageId = String(formData.get("pageId") ?? "").trim();
  if (!pageId) return;

  const row = await prisma.contentPage.findUnique({ where: { id: pageId } });
  if (!row) return;

  await prisma.contentPage.update({
    where: { id: pageId },
    data: { showInFooter: !row.showInFooter },
  });

  revalidateContentPagePaths(row.slug);
  redirect(withToastUrl("/console/halaman", contentPageToasts.statusUpdated));
}
