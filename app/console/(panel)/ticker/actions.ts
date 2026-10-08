"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  deleteTickerItemById,
  parseTickerForm,
  persistTickerItem,
  validateTickerInput,
  type TickerFormState,
} from "@/lib/content/ticker-mutations";
import { tickerToasts } from "@/lib/content/ticker-toasts";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { TickerFormState };

function revalidateTickerPaths() {
  revalidatePath("/console/ticker");
  revalidatePath("/");
}

export async function saveTickerItem(
  _prevState: TickerFormState,
  formData: FormData,
): Promise<TickerFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const tickerId = String(formData.get("tickerId") ?? "").trim() || undefined;
  const input = parseTickerForm(formData);
  const validation = validateTickerInput(input);
  if (validation) return validation;

  const result = await persistTickerItem(input, tickerId);
  if (result) return result;

  revalidateTickerPaths();
  redirect(
    withToastUrl(
      "/console/ticker",
      tickerId ? tickerToasts.updated : tickerToasts.created,
    ),
  );
}

export async function deleteTickerItem(formData: FormData) {
  await guardConsoleAdminAction();
  const tickerId = String(formData.get("tickerId") ?? "").trim();
  if (!tickerId) return;

  await deleteTickerItemById(tickerId);

  revalidateTickerPaths();
  redirect(withToastUrl("/console/ticker", tickerToasts.deleted));
}

export async function toggleTickerStatus(formData: FormData) {
  await guardConsoleAdminAction();
  const tickerId = String(formData.get("tickerId") ?? "").trim();
  if (!tickerId) return;

  const row = await prisma.tickerItem.findUnique({ where: { id: tickerId } });
  if (!row) return;

  await prisma.tickerItem.update({
    where: { id: tickerId },
    data: { isActive: !row.isActive },
  });

  revalidateTickerPaths();
  redirect(withToastUrl("/console/ticker", tickerToasts.statusUpdated));
}
