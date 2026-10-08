"use server";

import { ProductSkuStatus } from "@/app/generated/prisma/client";
import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import {
  parseProductForm,
  persistProduct,
  validateProductInput,
  type ProductFormState,
} from "@/lib/product-skus/product-mutations";
import { buildProductsListUrl, parseProductListFilters } from "@/lib/console-redirect";
import { withToastUrl } from "@/lib/console-toast";
import { productToasts } from "@/lib/product-skus/product-toasts";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { ProductFormState };

export async function saveProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const productSkuId = String(formData.get("productSkuId") ?? "").trim() || undefined;
  const input = parseProductForm(formData);
  const validation = validateProductInput(input);
  if (validation) return validation;

  const result = await persistProduct(input, productSkuId);
  if (result) return result;

  revalidatePath("/console/product-skus");
  revalidatePath("/console/produk");
  revalidatePath("/console");
  redirect(
    withToastUrl(
      buildProductsListUrl(parseProductListFilters(formData)),
      productSkuId ? productToasts.updated : productToasts.created,
    ),
  );
}

export async function deleteProduct(formData: FormData) {
  await guardConsoleAdminAction();
  const productSkuId = String(formData.get("productSkuId") ?? "");
  if (!productSkuId) return;

  await prisma.productSku.delete({ where: { id: productSkuId } });

  revalidatePath("/console/product-skus");
  revalidatePath("/console/produk");
  revalidatePath("/console");
  redirect(withToastUrl(buildProductsListUrl(parseProductListFilters(formData)), productToasts.deleted));
}

export async function toggleProductStatus(formData: FormData) {
  await guardConsoleAdminAction();
  const productSkuId = String(formData.get("productSkuId") ?? "");
  if (!productSkuId) return;

  const productSku = await prisma.productSku.findUnique({ where: { id: productSkuId } });
  if (!productSku) return;

  await prisma.productSku.update({
    where: { id: productSkuId },
    data: {
      status:
        productSku.status === ProductSkuStatus.AVAILABLE
          ? ProductSkuStatus.UNAVAILABLE
          : ProductSkuStatus.AVAILABLE,
    },
  });

  revalidatePath("/console/product-skus");
  revalidatePath("/console");
  redirect(
    withToastUrl(
      buildProductsListUrl(parseProductListFilters(formData)),
      productToasts.statusUpdated,
    ),
  );
}
