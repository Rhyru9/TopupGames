"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  deleteBannerById,
  parseBannerForm,
  persistBanner,
  validateBannerInput,
  type BannerFormState,
} from "@/lib/content/banner-mutations";
import { bannerToasts } from "@/lib/content/banner-toasts";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { BannerFormState };

function revalidateBannerPaths() {
  revalidatePath("/console/banners");
  revalidatePath("/");
}

export async function saveBanner(
  _prevState: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const bannerId = String(formData.get("bannerId") ?? "").trim() || undefined;
  const input = parseBannerForm(formData);
  const validation = validateBannerInput(input);
  if (validation) return validation;

  const result = await persistBanner(input, bannerId);
  if (result) return result;

  revalidateBannerPaths();
  redirect(
    withToastUrl(
      "/console/banners",
      bannerId ? bannerToasts.updated : bannerToasts.created,
    ),
  );
}

export async function deleteBanner(formData: FormData) {
  await guardConsoleAdminAction();
  const bannerId = String(formData.get("bannerId") ?? "").trim();
  if (!bannerId) return;

  await deleteBannerById(bannerId);

  revalidateBannerPaths();
  redirect(withToastUrl("/console/banners", bannerToasts.deleted));
}

export async function toggleBannerStatus(formData: FormData) {
  await guardConsoleAdminAction();
  const bannerId = String(formData.get("bannerId") ?? "").trim();
  if (!bannerId) return;

  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!banner) return;

  await prisma.banner.update({
    where: { id: bannerId },
    data: { isActive: !banner.isActive },
  });

  revalidateBannerPaths();
  redirect(withToastUrl("/console/banners", bannerToasts.statusUpdated));
}
