import { SitePopupMode } from "@/app/generated/prisma/client";
import { cleanupReplacedImage, deleteStoredImage } from "@/lib/storage/delete-stored-image";
import { validateImageUrl } from "@/lib/storage/image-url";
import { prisma } from "@/lib/prisma";
import {
  parsePopupForm,
  toPopupPersistData,
  validatePopupInput,
  type PopupFormInput,
  type PopupFormState,
  type PopupListItem,
  type SitePopupModeValue,
} from "@/lib/content/popup-form";

export type {
  PopupFormInput,
  PopupFormState,
  PopupListItem,
  SitePopupModeValue,
  StorefrontPopupData,
} from "@/lib/content/popup-form";
export {
  formatPopupDateTimeLocal,
  parsePopupForm,
  validatePopupInput,
} from "@/lib/content/popup-form";

export async function listPopups(options?: {
  skip?: number;
  take?: number;
}): Promise<{ items: PopupListItem[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.sitePopup.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        mode: true,
        imageUrl: true,
        ctaHref: true,
        dismissMinutes: true,
        sortOrder: true,
        startsAt: true,
        endsAt: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    prisma.sitePopup.count(),
  ]);

  const items: PopupListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    mode: row.mode as SitePopupModeValue,
    imageUrl: row.imageUrl,
    ctaHref: row.ctaHref,
    dismissMinutes: row.dismissMinutes,
    sortOrder: row.sortOrder,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    isActive: row.isActive,
    updatedAt: row.updatedAt,
  }));

  return { items, total };
}

export async function persistPopup(
  input: PopupFormInput,
  popupId?: string,
): Promise<PopupFormState | null> {
  if (input.mode === "IMAGE") {
    const imageError = validateImageUrl(input.imageUrl, { required: true });
    if (imageError) {
      return { fieldErrors: { imageUrl: imageError } };
    }
  }

  const data = toPopupPersistData(input);

  if (popupId) {
    const existing = await prisma.sitePopup.findUnique({ where: { id: popupId } });
    if (!existing) {
      return { error: "Popup tidak ditemukan." };
    }

    if (existing.imageUrl && existing.imageUrl !== data.imageUrl) {
      await cleanupReplacedImage(existing.imageUrl, data.imageUrl ?? "");
    } else if (existing.imageUrl && !data.imageUrl) {
      await deleteStoredImage(existing.imageUrl);
    }

    await prisma.sitePopup.update({
      where: { id: popupId },
      data: {
        ...data,
        mode: data.mode as SitePopupMode,
      },
    });
  } else {
    await prisma.sitePopup.create({
      data: {
        ...data,
        mode: data.mode as SitePopupMode,
      },
    });
  }

  return null;
}

export async function deletePopupById(popupId: string): Promise<void> {
  const existing = await prisma.sitePopup.findUnique({ where: { id: popupId } });
  if (!existing) return;

  await prisma.sitePopup.delete({ where: { id: popupId } });
  if (existing.imageUrl) {
    await deleteStoredImage(existing.imageUrl);
  }
}
