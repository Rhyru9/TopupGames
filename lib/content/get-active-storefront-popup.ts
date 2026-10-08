import { prisma } from "@/lib/prisma";
import type { StorefrontPopupData, SitePopupModeValue } from "@/lib/content/popup-form";

export async function getActiveStorefrontPopup(): Promise<StorefrontPopupData | null> {
  const now = new Date();

  const row = await prisma.sitePopup.findFirst({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      mode: true,
      body: true,
      imageUrl: true,
      ctaLabel: true,
      ctaHref: true,
      dismissMinutes: true,
      updatedAt: true,
    },
  });

  if (!row) return null;

  if (row.mode === "IMAGE" && !row.imageUrl) return null;
  if (row.mode === "TEXT" && !row.body && !row.title) return null;

  return {
    id: row.id,
    title: row.title,
    mode: row.mode as SitePopupModeValue,
    body: row.body,
    imageUrl: row.imageUrl,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    dismissMinutes: row.dismissMinutes,
    updatedAt: row.updatedAt.toISOString(),
  };
}
