import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  isMailConfigured,
  type SiteMailSettings,
} from "@/lib/site-settings/site-settings-schemas";

export async function getMailSettings(): Promise<SiteMailSettings> {
  const settings = await getSiteSettings();
  return settings.mail;
}

export async function isMailReady(): Promise<boolean> {
  const mail = await getMailSettings();
  return isMailConfigured(mail);
}
