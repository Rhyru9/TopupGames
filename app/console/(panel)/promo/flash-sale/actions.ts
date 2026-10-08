"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withToastUrl } from "@/lib/console-toast";
import {
  parseFlashSaleForm,
  persistFlashSale,
  type FlashSaleFormState,
} from "@/lib/promo/flash-sale-mutations";
import { flashSaleToasts } from "@/lib/promo/flash-sale-toasts";
import { prisma } from "@/lib/prisma";

export type { FlashSaleFormState };

function revalidateFlashSalePaths() {
  revalidatePath("/console/promo/flash-sale");
  revalidatePath("/");
}

export async function saveFlashSale(
  _prev: FlashSaleFormState,
  formData: FormData,
): Promise<FlashSaleFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const flashSaleId = String(formData.get("flashSaleId") ?? "").trim() || undefined;
  const parsed = parseFlashSaleForm(formData);
  if (parsed.error) return parsed.error;
  if (!parsed.input) return { error: "Data form tidak valid." };

  const result = await persistFlashSale(parsed.input, flashSaleId);
  if (result) return result;

  revalidateFlashSalePaths();
  redirect(
    withToastUrl(
      "/console/promo/flash-sale",
      flashSaleId ? flashSaleToasts.updated : flashSaleToasts.created,
    ),
  );
}

export async function deleteFlashSale(formData: FormData) {
  await guardConsoleAdminAction();
  const flashSaleId = String(formData.get("flashSaleId") ?? "").trim();
  if (!flashSaleId) return;

  await prisma.flashSale.delete({ where: { id: flashSaleId } }).catch(() => null);

  revalidateFlashSalePaths();
  redirect(withToastUrl("/console/promo/flash-sale", flashSaleToasts.deleted));
}

export async function toggleFlashSaleEnabled(formData: FormData) {
  await guardConsoleAdminAction();
  const flashSaleId = String(formData.get("flashSaleId") ?? "").trim();
  if (!flashSaleId) return;

  const row = await prisma.flashSale.findUnique({ where: { id: flashSaleId } });
  if (!row) return;

  await prisma.flashSale.update({
    where: { id: flashSaleId },
    data: { isEnabled: !row.isEnabled },
  });

  revalidateFlashSalePaths();
  redirect(withToastUrl("/console/promo/flash-sale", flashSaleToasts.statusUpdated));
}
