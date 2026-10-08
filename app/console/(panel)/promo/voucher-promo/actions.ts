"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withToastUrl } from "@/lib/console-toast";
import {
  parseVoucherForm,
  persistPromoVoucher,
  type VoucherFormState,
} from "@/lib/promo/voucher-mutations";
import { voucherToasts } from "@/lib/promo/voucher-toasts";
import {
  PromoVoucherRedemptionStatus,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type { VoucherFormState };

function revalidateVoucherPaths() {
  revalidatePath("/console/promo/voucher-promo");
}

export async function savePromoVoucher(
  _prev: VoucherFormState,
  formData: FormData,
): Promise<VoucherFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const voucherId = String(formData.get("voucherId") ?? "").trim() || undefined;
  const parsed = parseVoucherForm(formData);
  if (parsed.error) return parsed.error;
  if (!parsed.input) return { error: "Data form tidak valid." };

  const result = await persistPromoVoucher(parsed.input, voucherId);
  if (result) return result;

  revalidateVoucherPaths();
  redirect(
    withToastUrl(
      "/console/promo/voucher-promo",
      voucherId ? voucherToasts.updated : voucherToasts.created,
    ),
  );
}

export async function deletePromoVoucher(formData: FormData) {
  await guardConsoleAdminAction();
  const voucherId = String(formData.get("voucherId") ?? "").trim();
  if (!voucherId) return;

  const used = await prisma.promoVoucherRedemption.count({
    where: {
      voucherId,
      status: { in: [PromoVoucherRedemptionStatus.RESERVED, PromoVoucherRedemptionStatus.CONFIRMED] },
    },
  });
  if (used > 0) {
    redirect(
      withToastUrl(
        "/console/promo/voucher-promo",
        "Voucher tidak bisa dihapus — masih ada pemakaian aktif.",
        "error",
      ),
    );
  }

  await prisma.promoVoucher.delete({ where: { id: voucherId } }).catch(() => null);

  revalidateVoucherPaths();
  redirect(withToastUrl("/console/promo/voucher-promo", voucherToasts.deleted));
}

export async function togglePromoVoucherEnabled(formData: FormData) {
  await guardConsoleAdminAction();
  const voucherId = String(formData.get("voucherId") ?? "").trim();
  if (!voucherId) return;

  const row = await prisma.promoVoucher.findUnique({ where: { id: voucherId } });
  if (!row) return;

  await prisma.promoVoucher.update({
    where: { id: voucherId },
    data: { isEnabled: !row.isEnabled },
  });

  revalidateVoucherPaths();
  redirect(withToastUrl("/console/promo/voucher-promo", voucherToasts.statusUpdated));
}
