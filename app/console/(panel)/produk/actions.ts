"use server";

import { ProductStatus } from "@/app/generated/prisma/client";
import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import {
  parseGameForm,
  persistGame,
  validateGameInput,
  type GameFormState,
} from "@/lib/catalog-products/game-mutations";
import { gameToasts } from "@/lib/catalog-products/game-toasts";
import { withToastUrl } from "@/lib/console-toast";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { GameFormState };

export async function saveGame(
  _prevState: GameFormState,
  formData: FormData,
): Promise<GameFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const productId = String(formData.get("productId") ?? "").trim() || undefined;
  const input = parseGameForm(formData);
  const validation = validateGameInput(input);
  if (validation) return validation;

  const result = await persistGame(input, productId);
  if (result) return result;

  revalidatePath("/console/produk");
  revalidatePath("/console");
  revalidatePath("/");
  redirect(withToastUrl("/console/produk", productId ? gameToasts.updated : gameToasts.created));
}

export async function deleteGame(formData: FormData) {
  await guardConsoleAdminAction();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/console/produk");
  revalidatePath("/console");
  revalidatePath("/");
  redirect(withToastUrl("/console/produk", gameToasts.deleted));
}

export async function toggleGameStatus(formData: FormData) {
  await guardConsoleAdminAction();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  await prisma.product.update({
    where: { id: productId },
    data: {
      status:
        product.status === ProductStatus.ACTIVE
          ? ProductStatus.HIDDEN
          : ProductStatus.ACTIVE,
    },
  });

  revalidatePath("/console/produk");
  revalidatePath("/console");
  revalidatePath("/");
  redirect(withToastUrl("/console/produk", gameToasts.statusUpdated));
}

export async function toggleGamePopular(formData: FormData) {
  await guardConsoleAdminAction();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) return;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  await prisma.product.update({
    where: { id: productId },
    data: { isPopular: !product.isPopular },
  });

  revalidatePath("/console/produk");
  revalidatePath("/console");
  revalidatePath("/");
  redirect(withToastUrl("/console/produk", gameToasts.popularUpdated));
}
