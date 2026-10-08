"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  deletePopupById,
  parsePopupForm,
  persistPopup,
  validatePopupInput,
  type PopupFormState,
} from "@/lib/content/popup-mutations";
import { popupToasts } from "@/lib/content/popup-toasts";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { PopupFormState };

function revalidatePopupPaths() {
  revalidatePath("/console/popup");
  revalidatePath("/");
  revalidatePath("/produk");
}

export async function savePopup(
  _prevState: PopupFormState,
  formData: FormData,
): Promise<PopupFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const popupId = String(formData.get("popupId") ?? "").trim() || undefined;
  const input = parsePopupForm(formData);
  const validation = validatePopupInput(input);
  if (validation) return validation;

  const result = await persistPopup(input, popupId);
  if (result) return result;

  revalidatePopupPaths();
  redirect(
    withToastUrl("/console/popup", popupId ? popupToasts.updated : popupToasts.created),
  );
}

export async function deletePopup(formData: FormData) {
  await guardConsoleAdminAction();
  const popupId = String(formData.get("popupId") ?? "").trim();
  if (!popupId) return;

  await deletePopupById(popupId);

  revalidatePopupPaths();
  redirect(withToastUrl("/console/popup", popupToasts.deleted));
}

export async function togglePopupStatus(formData: FormData) {
  await guardConsoleAdminAction();
  const popupId = String(formData.get("popupId") ?? "").trim();
  if (!popupId) return;

  const row = await prisma.sitePopup.findUnique({ where: { id: popupId } });
  if (!row) return;

  await prisma.sitePopup.update({
    where: { id: popupId },
    data: { isActive: !row.isActive },
  });

  revalidatePopupPaths();
  redirect(withToastUrl("/console/popup", popupToasts.statusUpdated));
}
