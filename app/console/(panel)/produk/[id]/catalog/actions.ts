"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withToastUrl } from "@/lib/console-toast";
import { gameCatalogToasts } from "@/lib/catalog-products/game-catalog-toasts";
import {
  createProductType,
  deleteProductType,
  type GameCatalogActionState,
  updateProductType,
} from "@/lib/catalog-products/game-catalog-mutations";
import { prisma } from "@/lib/prisma";

export type { GameCatalogActionState } from "@/lib/catalog-products/game-catalog-mutations";

function revalidateProductCatalog(productId: string) {
  revalidatePath(`/console/produk/${productId}/edit`);
  revalidatePath("/console/product-skus");
  revalidatePath("/console/product-skus/check");
  revalidatePath("/console/jenis-produk");
}

export async function saveProductType(
  _prev: GameCatalogActionState,
  formData: FormData,
): Promise<GameCatalogActionState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const productId = String(formData.get("productId") ?? "").trim();
  const productTypeId = String(formData.get("productTypeId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const iconUrl = String(formData.get("iconUrl") ?? "").trim();

  if (!productId || !name) {
    return { error: "Nama jenis produk wajib diisi." };
  }

  try {
    if (productTypeId) {
      await updateProductType(productTypeId, { name, slug, iconUrl });
    } else {
      await createProductType({ productId, name, slug, iconUrl });
    }
    revalidateProductCatalog(productId);
    return { success: "Jenis produk berhasil disimpan." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal menyimpan jenis produk.",
    };
  }
}

export async function removeProductType(
  _prev: GameCatalogActionState,
  formData: FormData,
): Promise<GameCatalogActionState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const productId = String(formData.get("productId") ?? "").trim();
  const productTypeId = String(formData.get("productTypeId") ?? "").trim();

  if (!productId || !productTypeId) {
    return { error: "Jenis produk tidak valid." };
  }

  try {
    await deleteProductType(productTypeId);
    revalidateProductCatalog(productId);
    return { success: "Jenis produk berhasil dihapus." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal menghapus jenis produk.",
    };
  }
}

export async function deleteProductTypeForm(formData: FormData) {
  await guardConsoleAdminAction();
  const productId = String(formData.get("productId") ?? "").trim();
  const productTypeId = String(formData.get("productTypeId") ?? "").trim();

  if (!productId || !productTypeId) return;

  await deleteProductType(productTypeId);
  revalidateProductCatalog(productId);
  redirect(withToastUrl("/console/jenis-produk", gameCatalogToasts.typeDeleted));
}

export async function getGameCatalogProviders(productId: string) {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return [];

  return prisma.fulfillmentProvider.findMany({
    where: { slug: { in: ["digiflazz", "melostore"] }, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true },
  });
}
