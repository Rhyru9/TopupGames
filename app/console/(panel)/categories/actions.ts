"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  parseCatalogCategoryForm,
  persistCatalogCategory,
  validateCatalogCategoryInput,
  type CatalogCategoryFormState,
} from "@/lib/catalog-categories/game-type-mutations";
import { catalogCategoryToasts } from "@/lib/catalog-categories/game-type-toasts";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { CatalogCategoryFormState as GameTypeFormState };

export async function saveGameType(
  _prevState: CatalogCategoryFormState,
  formData: FormData,
): Promise<CatalogCategoryFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const categoryId = String(formData.get("categoryId") ?? "").trim() || undefined;
  const input = parseCatalogCategoryForm(formData);
  const validation = validateCatalogCategoryInput(input);
  if (validation) return validation;

  const result = await persistCatalogCategory(input, categoryId);
  if (result) return result;

  revalidatePath("/console/categories");
  revalidatePath("/console/produk");
  redirect(
    withToastUrl(
      "/console/categories",
      categoryId ? catalogCategoryToasts.updated : catalogCategoryToasts.created,
    ),
  );
}

export async function deleteGameType(formData: FormData) {
  await guardConsoleAdminAction();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!categoryId) return;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  });
  if (!category) return;

  if (category._count.products > 0) return;

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/console/categories");
  revalidatePath("/console/produk");
  redirect(withToastUrl("/console/categories", catalogCategoryToasts.deleted));
}

export async function toggleGameTypeStatus(formData: FormData) {
  await guardConsoleAdminAction();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!categoryId) return;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return;

  await prisma.category.update({
    where: { id: categoryId },
    data: { isActive: !category.isActive },
  });

  revalidatePath("/console/categories");
  revalidatePath("/console/produk");
  redirect(withToastUrl("/console/categories", catalogCategoryToasts.statusUpdated));
}
