"use server";

import { assertSuperAdminAction } from "@/lib/admin/require-super";
import { withToastUrl } from "@/lib/console-toast";
import {
  parseSiteAuthForm,
  parseSiteGeneralForm,
  parseSiteMailForm,
  parseSitePwaForm,
  parseSiteSeoForm,
  parseSiteStorageForm,
  parseSiteStyleForm,
  persistSiteAuth,
  persistSiteCronSecret,
  persistSiteGeneral,
  persistSiteMail,
  persistSitePwa,
  persistSiteSeo,
  persistSiteStorage,
  persistSiteStyle,
  type SiteSettingsFormState,
  validateSiteAuthInput,
  validateSiteGeneralInput,
  validateSiteMailInput,
  validateSitePwaInput,
  validateSiteSeoInput,
  validateSiteStorageInput,
  validateSiteStyleInput,
} from "@/lib/site-settings/site-settings-mutations";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { siteSettingsToasts } from "@/lib/site-settings/site-settings-toasts";
import { mailTemplateKeys } from "@/lib/mail/template-keys";
import { sendTemplatedMail } from "@/lib/mail/send-templated-mail";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { SiteSettingsFormState };

function revalidateWebsiteSettings() {
  revalidatePath("/console/settings/website");
  revalidatePath("/");
  revalidatePath("/masuk");
  revalidatePath("/manifest.webmanifest");
}

export async function saveWebsiteGeneral(
  _prevState: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const input = parseSiteGeneralForm(formData);
  const validation = validateSiteGeneralInput(input);
  if (validation) return validation;

  try {
    await persistSiteGeneral(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan umum." };
  }

  revalidateWebsiteSettings();
  redirect(withToastUrl("/console/settings/website?section=general", siteSettingsToasts.generalUpdated));
}

export async function saveWebsiteSeo(
  _prevState: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const input = parseSiteSeoForm(formData);
  const validation = validateSiteSeoInput(input);
  if (validation) return validation;

  try {
    await persistSiteSeo(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan SEO." };
  }

  revalidateWebsiteSettings();
  redirect(withToastUrl("/console/settings/website?section=seo", siteSettingsToasts.seoUpdated));
}

export async function saveWebsiteStorage(
  _prevState: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const current = await getSiteSettings();
  const input = parseSiteStorageForm(formData, current.storage);
  const validation = validateSiteStorageInput(input);
  if (validation) return validation;

  try {
    await persistSiteStorage(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan penyimpanan." };
  }

  revalidateWebsiteSettings();
  redirect(withToastUrl("/console/settings/website?section=storage", siteSettingsToasts.storageUpdated));
}

export async function saveWebsiteStyle(
  _prevState: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const input = parseSiteStyleForm(formData);
  const validation = validateSiteStyleInput(input);
  if (validation) return validation;

  try {
    await persistSiteStyle(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan style." };
  }

  revalidateWebsiteSettings();
  redirect(withToastUrl("/console/settings/website?section=style", siteSettingsToasts.styleUpdated));
}

export async function saveWebsitePwa(
  _prevState: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const input = parseSitePwaForm(formData);
  const validation = validateSitePwaInput(input);
  if (validation) return validation;

  try {
    await persistSitePwa(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan PWA." };
  }

  revalidateWebsiteSettings();
  redirect(withToastUrl("/console/settings/website?section=pwa", siteSettingsToasts.pwaUpdated));
}

export async function saveWebsiteAuth(
  _prevState: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const current = await getSiteSettings();
  const input = parseSiteAuthForm(formData, current.auth);
  const validation = validateSiteAuthInput(input);
  if (validation) return validation;

  try {
    await persistSiteAuth(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan autentikasi." };
  }

  revalidateWebsiteSettings();
  redirect(withToastUrl("/console/settings/website?section=auth", siteSettingsToasts.authUpdated));
}

export async function saveWebsiteMail(
  _prevState: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const current = await getSiteSettings();
  const input = parseSiteMailForm(formData, current.mail);
  const validation = validateSiteMailInput(input);
  if (validation) return validation;

  try {
    await persistSiteMail(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan email." };
  }

  revalidateWebsiteSettings();
  redirect(withToastUrl("/console/settings/website?section=mail", siteSettingsToasts.mailUpdated));
}

export async function sendWebsiteMailTest(
  to: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

  const email = to.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Alamat email test tidak valid." };
  }

  return sendTemplatedMail({
    template: mailTemplateKeys.mailTest,
    entityType: "system",
    entityId: `test-${Date.now()}`,
    to: email,
    data: {},
    skipToggle: true,
    skipDedup: true,
  });
}

export async function generateWebsiteCronSecret(input?: {
  rotate?: boolean;
}): Promise<{ ok: true; secret: string; rotated: boolean } | { ok: false; error: string }> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const current = await getSiteSettings();
    const existing = current.cron.secret.trim();
    const rotate = Boolean(input?.rotate);

    if (existing && !rotate) {
      return {
        ok: false,
        error: "Secret sudah ada. Pakai Generate ulang hanya jika secret bocor.",
      };
    }

    const secret = randomBytes(32).toString("base64url");
    await persistSiteCronSecret(secret);
    revalidateWebsiteSettings();

    return { ok: true, secret, rotated: Boolean(existing) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal membuat cron secret.",
    };
  }
}
