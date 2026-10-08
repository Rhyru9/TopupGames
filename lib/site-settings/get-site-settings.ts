import { cache } from "react";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  defaultSiteGeneral,
  defaultSiteSeo,
  defaultSiteStorage,
  defaultSiteStyle,
  defaultSitePwa,
  defaultSiteAuth,
  defaultSiteCron,
  defaultSiteMail,
  parseSiteSettingsRow,
  type SiteSettingsData,
} from "@/lib/site-settings/site-settings-schemas";

export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  const row = await prisma.siteSetting.findUnique({ where: { id: "default" } });

  if (!row) {
    const created = await prisma.siteSetting.create({
      data: {
        id: "default",
        general: defaultSiteGeneral as Prisma.InputJsonValue,
        seo: defaultSiteSeo as Prisma.InputJsonValue,
        storage: defaultSiteStorage as Prisma.InputJsonValue,
        style: defaultSiteStyle as Prisma.InputJsonValue,
        pwa: defaultSitePwa as Prisma.InputJsonValue,
        auth: defaultSiteAuth as Prisma.InputJsonValue,
        cron: defaultSiteCron as Prisma.InputJsonValue,
        mail: defaultSiteMail as Prisma.InputJsonValue,
      },
    });
    return parseSiteSettingsRow(created);
  }

  return parseSiteSettingsRow(row);
});

export async function getSiteStorageSettings() {
  const settings = await getSiteSettings();
  return settings.storage;
}

export async function getSiteStyleSettings() {
  const settings = await getSiteSettings();
  return settings.style;
}
