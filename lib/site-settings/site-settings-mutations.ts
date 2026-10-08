import { Prisma } from "@/app/generated/prisma/client";
import { cleanupReplacedImage } from "@/lib/storage/delete-stored-image";
import { validateImageUrl } from "@/lib/storage/image-url";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  mergeCloudflareR2Settings,
  mergeSiteAuthSettings,
  mergeSiteMailSettings,
  parseCloudflareR2Settings,
  parseLocalStorageSettings,
  type GridColumnCount,
  type GridGapDensity,
  type SiteAuthSettings,
  type SiteGeneralSettings,
  type SiteMailSettings,
  type SitePwaSettings,
  type SiteSeoSettings,
  type SiteStorageSettings,
  type SiteStyleSettings,
  type StorageDriver,
} from "@/lib/site-settings/site-settings-schemas";

export type SiteSettingsFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validateOptionalUrl(value: string, field: string, fieldErrors: Record<string, string>) {
  if (!value.trim()) return;
  const error = validateImageUrl(value);
  if (error) fieldErrors[field] = error;
}

function validateHttpUrl(value: string, field: string, fieldErrors: Record<string, string>, label: string) {
  if (!value.trim()) return;
  try {
    const parsed = new URL(value.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      fieldErrors[field] = `${label} harus diawali http:// atau https://.`;
    }
  } catch {
    fieldErrors[field] = `${label} harus URL valid.`;
  }
}

function validateVerificationToken(
  value: string,
  field: string,
  fieldErrors: Record<string, string>,
  label: string,
) {
  const token = value.trim();
  if (!token) return;
  if (token.length > 200) {
    fieldErrors[field] = `Kode verifikasi ${label} terlalu panjang.`;
    return;
  }
  if (!/^[A-Za-z0-9_\-.=]+$/.test(token)) {
    fieldErrors[field] = `Kode verifikasi ${label} tidak valid.`;
  }
}

export function parseSiteGeneralForm(formData: FormData): SiteGeneralSettings {
  const enabledRaw = formData.get("supportWhatsappEnabled");
  return {
    siteName: String(formData.get("siteName") ?? "").trim(),
    siteUrl: String(formData.get("siteUrl") ?? "").trim(),
    logoHeaderUrl: String(formData.get("logoHeaderUrl") ?? "").trim(),
    logoFooterUrl: String(formData.get("logoFooterUrl") ?? "").trim(),
    faviconUrl: String(formData.get("faviconUrl") ?? "").trim(),
    whatsappUrl: String(formData.get("whatsappUrl") ?? "").trim(),
    instagramUrl: String(formData.get("instagramUrl") ?? "").trim(),
    tiktokUrl: String(formData.get("tiktokUrl") ?? "").trim(),
    youtubeUrl: String(formData.get("youtubeUrl") ?? "").trim(),
    facebookUrl: String(formData.get("facebookUrl") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    playStoreUrl: String(formData.get("playStoreUrl") ?? "").trim(),
    appStoreUrl: String(formData.get("appStoreUrl") ?? "").trim(),
    supportWhatsappEnabled:
      enabledRaw === "on" || enabledRaw === "true" || enabledRaw === "1",
    supportWhatsappNumber: String(formData.get("supportWhatsappNumber") ?? "").trim(),
    supportWhatsappMessage: String(formData.get("supportWhatsappMessage") ?? "").trim(),
    supportWhatsappLabel: String(formData.get("supportWhatsappLabel") ?? "").trim(),
  };
}

export function validateSiteGeneralInput(input: SiteGeneralSettings): SiteSettingsFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.siteName) fieldErrors.siteName = "Nama website wajib diisi.";
  validateHttpUrl(input.siteUrl, "siteUrl", fieldErrors, "URL website");
  validateOptionalUrl(input.logoHeaderUrl, "logoHeaderUrl", fieldErrors);
  validateOptionalUrl(input.logoFooterUrl, "logoFooterUrl", fieldErrors);
  validateOptionalUrl(input.faviconUrl, "faviconUrl", fieldErrors);
  validateHttpUrl(input.whatsappUrl, "whatsappUrl", fieldErrors, "URL WhatsApp");
  validateHttpUrl(input.instagramUrl, "instagramUrl", fieldErrors, "URL Instagram");
  validateHttpUrl(input.tiktokUrl, "tiktokUrl", fieldErrors, "URL TikTok");
  validateHttpUrl(input.youtubeUrl, "youtubeUrl", fieldErrors, "URL YouTube");
  validateHttpUrl(input.facebookUrl, "facebookUrl", fieldErrors, "URL Facebook");
  if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    fieldErrors.email = "Email tidak valid.";
  }
  validateHttpUrl(input.playStoreUrl, "playStoreUrl", fieldErrors, "URL Play Store");
  validateHttpUrl(input.appStoreUrl, "appStoreUrl", fieldErrors, "URL App Store");

  if (input.supportWhatsappEnabled || input.supportWhatsappNumber) {
    const digits = input.supportWhatsappNumber.replace(/\D/g, "");
    if (!digits) {
      fieldErrors.supportWhatsappNumber = "Nomor WhatsApp bantuan wajib diisi.";
    } else if (digits.length < 10 || digits.length > 15) {
      fieldErrors.supportWhatsappNumber = "Nomor WhatsApp tidak valid.";
    }
  }

  if (input.supportWhatsappMessage.length > 500) {
    fieldErrors.supportWhatsappMessage = "Pesan maksimal 500 karakter.";
  }

  if (input.supportWhatsappLabel.length > 32) {
    fieldErrors.supportWhatsappLabel = "Label maksimal 32 karakter.";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return null;
}

export function parseSiteSeoForm(formData: FormData): SiteSeoSettings {
  return {
    metaTitle: String(formData.get("metaTitle") ?? "").trim(),
    metaKeywords: String(formData.get("metaKeywords") ?? "").trim(),
    metaDescription: String(formData.get("metaDescription") ?? "").trim(),
    ogImageUrl: String(formData.get("ogImageUrl") ?? "").trim(),
    googleAnalyticsId: String(formData.get("googleAnalyticsId") ?? "").trim(),
    googleTagManagerId: String(formData.get("googleTagManagerId") ?? "").trim(),
    googleSiteVerification: String(formData.get("googleSiteVerification") ?? "").trim(),
    bingSiteVerification: String(formData.get("bingSiteVerification") ?? "").trim(),
    yandexVerification: String(formData.get("yandexVerification") ?? "").trim(),
    pinterestVerification: String(formData.get("pinterestVerification") ?? "").trim(),
    facebookDomainVerification: String(formData.get("facebookDomainVerification") ?? "").trim(),
  };
}

function validateGoogleAnalyticsId(
  value: string,
  fieldErrors: Record<string, string>,
) {
  const id = value.trim();
  if (!id) return;
  if (!/^(G-[A-Z0-9]+|UA-\d+-\d+)$/i.test(id)) {
    fieldErrors.googleAnalyticsId =
      "Format Measurement ID tidak valid. Contoh: G-XXXXXXXXXX";
  }
}

function validateGoogleTagManagerId(
  value: string,
  fieldErrors: Record<string, string>,
) {
  const id = value.trim();
  if (!id) return;
  if (!/^GTM-[A-Z0-9]+$/i.test(id)) {
    fieldErrors.googleTagManagerId =
      "Format Container ID tidak valid. Contoh: GTM-XXXXXXX";
  }
}

export function validateSiteSeoInput(input: SiteSeoSettings): SiteSettingsFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.metaTitle) fieldErrors.metaTitle = "Judul meta wajib diisi.";
  if (!input.metaDescription) fieldErrors.metaDescription = "Deskripsi meta wajib diisi.";
  validateOptionalUrl(input.ogImageUrl, "ogImageUrl", fieldErrors);
  validateGoogleAnalyticsId(input.googleAnalyticsId, fieldErrors);
  validateGoogleTagManagerId(input.googleTagManagerId, fieldErrors);
  validateVerificationToken(input.googleSiteVerification, "googleSiteVerification", fieldErrors, "Google");
  validateVerificationToken(input.bingSiteVerification, "bingSiteVerification", fieldErrors, "Bing");
  validateVerificationToken(input.yandexVerification, "yandexVerification", fieldErrors, "Yandex");
  validateVerificationToken(input.pinterestVerification, "pinterestVerification", fieldErrors, "Pinterest");
  validateVerificationToken(
    input.facebookDomainVerification,
    "facebookDomainVerification",
    fieldErrors,
    "Facebook",
  );

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return null;
}

export function parseSiteStorageForm(
  formData: FormData,
  existing: SiteStorageSettings,
): SiteStorageSettings {
  const driver = String(formData.get("driver") ?? "local") as StorageDriver;
  const incomingR2 = parseCloudflareR2Settings({
    accountId: String(formData.get("r2AccountId") ?? "").trim(),
    accessKeyId: String(formData.get("r2AccessKeyId") ?? "").trim(),
    secretAccessKey: String(formData.get("r2SecretAccessKey") ?? "").trim(),
    bucket: String(formData.get("r2Bucket") ?? "").trim(),
    publicBaseUrl: String(formData.get("r2PublicBaseUrl") ?? "").trim(),
    endpoint: String(formData.get("r2Endpoint") ?? "").trim(),
  });

  return {
    driver: driver === "cloudflare_r2" ? "cloudflare_r2" : "local",
    local: parseLocalStorageSettings({
      uploadDir: String(formData.get("localUploadDir") ?? "").trim(),
      publicUrlPrefix: String(formData.get("localPublicUrlPrefix") ?? "").trim() || "/uploads",
    }),
    cloudflareR2: mergeCloudflareR2Settings(existing.cloudflareR2, incomingR2),
  };
}

export function validateSiteStorageInput(input: SiteStorageSettings): SiteSettingsFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (input.driver === "cloudflare_r2") {
    const r2 = input.cloudflareR2;
    if (!r2.accountId) fieldErrors.r2AccountId = "Account ID wajib diisi.";
    if (!r2.accessKeyId) fieldErrors.r2AccessKeyId = "Access Key ID wajib diisi.";
    if (!r2.secretAccessKey) fieldErrors.r2SecretAccessKey = "Secret Access Key wajib diisi.";
    if (!r2.bucket) fieldErrors.r2Bucket = "Bucket wajib diisi.";
    if (!r2.publicBaseUrl) {
      fieldErrors.r2PublicBaseUrl = "Public URL wajib diisi.";
    } else {
      validateHttpUrl(r2.publicBaseUrl, "r2PublicBaseUrl", fieldErrors, "Public URL");
    }
    if (r2.endpoint) {
      validateHttpUrl(r2.endpoint, "r2Endpoint", fieldErrors, "Endpoint");
    }
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return null;
}

export async function persistSiteGeneral(input: SiteGeneralSettings): Promise<void> {
  const current = await getSiteSettings();

  await cleanupReplacedImage(current.general.logoHeaderUrl, input.logoHeaderUrl);
  await cleanupReplacedImage(current.general.logoFooterUrl, input.logoFooterUrl);
  await cleanupReplacedImage(current.general.faviconUrl, input.faviconUrl);

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      general: input as Prisma.InputJsonValue,
      seo: current.seo as Prisma.InputJsonValue,
      storage: current.storage as Prisma.InputJsonValue,
      style: current.style as Prisma.InputJsonValue,
      pwa: current.pwa as Prisma.InputJsonValue,
      auth: current.auth as Prisma.InputJsonValue,
      cron: current.cron as Prisma.InputJsonValue,
      mail: current.mail as Prisma.InputJsonValue,
    },
    update: {
      general: input as Prisma.InputJsonValue,
    },
  });
}

export async function persistSiteSeo(input: SiteSeoSettings): Promise<void> {
  const current = await getSiteSettings();

  await cleanupReplacedImage(current.seo.ogImageUrl, input.ogImageUrl);

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      general: current.general as Prisma.InputJsonValue,
      seo: input as Prisma.InputJsonValue,
      storage: current.storage as Prisma.InputJsonValue,
      style: current.style as Prisma.InputJsonValue,
      pwa: current.pwa as Prisma.InputJsonValue,
      auth: current.auth as Prisma.InputJsonValue,
      cron: current.cron as Prisma.InputJsonValue,
      mail: current.mail as Prisma.InputJsonValue,
    },
    update: {
      seo: input as Prisma.InputJsonValue,
    },
  });
}

export async function persistSiteStorage(input: SiteStorageSettings): Promise<void> {
  const current = await getSiteSettings();

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      general: current.general as Prisma.InputJsonValue,
      seo: current.seo as Prisma.InputJsonValue,
      storage: input as Prisma.InputJsonValue,
      style: current.style as Prisma.InputJsonValue,
      pwa: current.pwa as Prisma.InputJsonValue,
      auth: current.auth as Prisma.InputJsonValue,
      cron: current.cron as Prisma.InputJsonValue,
      mail: current.mail as Prisma.InputJsonValue,
    },
    update: {
      storage: input as Prisma.InputJsonValue,
    },
  });
}

function readFormColumn(formData: FormData, key: string, fallback: GridColumnCount): GridColumnCount {
  const n = Number.parseInt(String(formData.get(key) ?? ""), 10);
  if (n === 2 || n === 3 || n === 4 || n === 5 || n === 6) return n;
  return fallback;
}

function readFormGap(formData: FormData, key: string, fallback: GridGapDensity): GridGapDensity {
  const value = String(formData.get(key) ?? "").trim();
  if (value === "tight" || value === "normal" || value === "relaxed") return value;
  return fallback;
}

export function parseSiteStyleForm(formData: FormData): SiteStyleSettings {
  function readSlide(key: string, fallback: number): number {
    const raw = Number.parseFloat(String(formData.get(key) ?? ""));
    if (!Number.isFinite(raw) || raw < 1 || raw > 8) return fallback;
    return Math.round(raw * 10) / 10;
  }

  return {
    popular: {
      columns: {
        mobile: readFormColumn(formData, "popularMobile", 3),
        tablet: readFormColumn(formData, "popularTablet", 4),
        desktop: readFormColumn(formData, "popularDesktop", 6),
      },
      gap: readFormGap(formData, "popularGap", "normal"),
    },
    catalog: {
      columns: {
        mobile: readFormColumn(formData, "catalogMobile", 3),
        tablet: readFormColumn(formData, "catalogTablet", 6),
        desktop: readFormColumn(formData, "catalogDesktop", 6),
      },
      pageRows: (() => {
        const n = Number.parseInt(String(formData.get("catalogPageRows") ?? "3"), 10);
        return Number.isFinite(n) ? n : 3;
      })(),
      gap: readFormGap(formData, "catalogGap", "normal"),
    },
    flashSale: {
      slidesPerView: {
        mobile: readSlide("flashMobile", 1.8),
        tablet: readSlide("flashTablet", 3.5),
        desktop: readSlide("flashDesktop", 5.1),
      },
    },
  };
}

export function validateSiteStyleInput(input: SiteStyleSettings): SiteSettingsFormState | null {
  const fieldErrors: Record<string, string> = {};
  if (input.catalog.pageRows < 1 || input.catalog.pageRows > 6) {
    fieldErrors.catalogPageRows = "Baris per tampilan harus 1–6.";
  }
  const slides = input.flashSale.slidesPerView;
  if (slides.mobile < 1 || slides.mobile > 8) {
    fieldErrors.flashMobile = "Tampilan flash harus 1–8 (boleh desimal, contoh 1.8).";
  }
  if (slides.tablet < 1 || slides.tablet > 8) {
    fieldErrors.flashTablet = "Tampilan flash harus 1–8 (boleh desimal, contoh 3.5).";
  }
  if (slides.desktop < 1 || slides.desktop > 8) {
    fieldErrors.flashDesktop = "Tampilan flash harus 1–8 (boleh desimal, contoh 5.1).";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return null;
}

export async function persistSiteStyle(input: SiteStyleSettings): Promise<void> {
  const current = await getSiteSettings();

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      general: current.general as Prisma.InputJsonValue,
      seo: current.seo as Prisma.InputJsonValue,
      storage: current.storage as Prisma.InputJsonValue,
      style: input as Prisma.InputJsonValue,
      pwa: current.pwa as Prisma.InputJsonValue,
      auth: current.auth as Prisma.InputJsonValue,
      cron: current.cron as Prisma.InputJsonValue,
      mail: current.mail as Prisma.InputJsonValue,
    },
    update: {
      style: input as Prisma.InputJsonValue,
    },
  });
}

function readFormHexColor(formData: FormData, key: string, fallback: string): string {
  const raw = String(formData.get(key) ?? "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const [, r, g, b] = raw;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function parseSitePwaForm(formData: FormData): SitePwaSettings {
  const enabledRaw = formData.get("enabled");
  return {
    enabled: enabledRaw === "on" || enabledRaw === "true" || enabledRaw === "1",
    name: String(formData.get("name") ?? "").trim(),
    shortName: String(formData.get("shortName") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    themeColor: readFormHexColor(formData, "themeColor", "#ff7a1a"),
    backgroundColor: readFormHexColor(formData, "backgroundColor", "#050505"),
    iconUrl: String(formData.get("iconUrl") ?? "").trim(),
  };
}

export function validateSitePwaInput(input: SitePwaSettings): SiteSettingsFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (input.shortName.length > 12) {
    fieldErrors.shortName = "Short name maksimal 12 karakter.";
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(input.themeColor)) {
    fieldErrors.themeColor = "Theme color harus format #RRGGBB.";
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(input.backgroundColor)) {
    fieldErrors.backgroundColor = "Background color harus format #RRGGBB.";
  }
  validateOptionalUrl(input.iconUrl, "iconUrl", fieldErrors);

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return null;
}

export async function persistSitePwa(input: SitePwaSettings): Promise<void> {
  const current = await getSiteSettings();

  await cleanupReplacedImage(current.pwa.iconUrl, input.iconUrl);

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      general: current.general as Prisma.InputJsonValue,
      seo: current.seo as Prisma.InputJsonValue,
      storage: current.storage as Prisma.InputJsonValue,
      style: current.style as Prisma.InputJsonValue,
      pwa: input as Prisma.InputJsonValue,
      auth: current.auth as Prisma.InputJsonValue,
      cron: current.cron as Prisma.InputJsonValue,
      mail: current.mail as Prisma.InputJsonValue,
    },
    update: {
      pwa: input as Prisma.InputJsonValue,
    },
  });
}

export function parseSiteAuthForm(
  formData: FormData,
  existing: SiteAuthSettings,
): SiteAuthSettings {
  const enabledRaw = formData.get("googleEnabled");
  const incoming: SiteAuthSettings = {
    googleEnabled: enabledRaw === "on" || enabledRaw === "true" || enabledRaw === "1",
    googleClientId: String(formData.get("googleClientId") ?? "").trim(),
    googleClientSecret: String(formData.get("googleClientSecret") ?? "").trim(),
  };
  return mergeSiteAuthSettings(existing, incoming);
}

export function validateSiteAuthInput(input: SiteAuthSettings): SiteSettingsFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (input.googleEnabled) {
    if (!input.googleClientId.trim()) {
      fieldErrors.googleClientId = "Client ID wajib jika Google login aktif.";
    }
    if (!input.googleClientSecret.trim()) {
      fieldErrors.googleClientSecret = "Client Secret wajib jika Google login aktif.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return null;
}

export async function persistSiteAuth(input: SiteAuthSettings): Promise<void> {
  const current = await getSiteSettings();

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      general: current.general as Prisma.InputJsonValue,
      seo: current.seo as Prisma.InputJsonValue,
      storage: current.storage as Prisma.InputJsonValue,
      style: current.style as Prisma.InputJsonValue,
      pwa: current.pwa as Prisma.InputJsonValue,
      auth: input as Prisma.InputJsonValue,
      cron: current.cron as Prisma.InputJsonValue,
      mail: current.mail as Prisma.InputJsonValue,
    },
    update: {
      auth: input as Prisma.InputJsonValue,
    },
  });
}

export async function persistSiteCronSecret(secret: string): Promise<void> {
  const current = await getSiteSettings();
  const cron = { secret: secret.trim() };

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      general: current.general as Prisma.InputJsonValue,
      seo: current.seo as Prisma.InputJsonValue,
      storage: current.storage as Prisma.InputJsonValue,
      style: current.style as Prisma.InputJsonValue,
      pwa: current.pwa as Prisma.InputJsonValue,
      auth: current.auth as Prisma.InputJsonValue,
      cron: cron as Prisma.InputJsonValue,
      mail: current.mail as Prisma.InputJsonValue,
    },
    update: {
      cron: cron as Prisma.InputJsonValue,
    },
  });
}

function readFormBool(formData: FormData, key: string): boolean {
  const raw = formData.get(key);
  return raw === "on" || raw === "true" || raw === "1";
}

export function parseSiteMailForm(
  formData: FormData,
  existing: SiteMailSettings,
): SiteMailSettings {
  const portRaw = Number.parseInt(String(formData.get("port") ?? "587"), 10);
  const incoming: SiteMailSettings = {
    enabled: readFormBool(formData, "enabled"),
    host: String(formData.get("host") ?? "").trim(),
    port: Number.isFinite(portRaw) && portRaw >= 1 && portRaw <= 65535 ? portRaw : 587,
    secure: readFormBool(formData, "secure"),
    username: String(formData.get("username") ?? "").trim(),
    password: String(formData.get("password") ?? "").trim(),
    fromEmail: String(formData.get("fromEmail") ?? "").trim(),
    fromName: String(formData.get("fromName") ?? "").trim(),
    replyTo: String(formData.get("replyTo") ?? "").trim(),
    notifications: {
      memberVerify: readFormBool(formData, "notifyMemberVerify"),
      passwordReset: readFormBool(formData, "notifyPasswordReset"),
      orderCreated: readFormBool(formData, "notifyOrderCreated"),
      orderPaid: readFormBool(formData, "notifyOrderPaid"),
      orderFailed: readFormBool(formData, "notifyOrderFailed"),
      orderFulfillmentFailed: readFormBool(formData, "notifyOrderFulfillmentFailed"),
      orderFulfillmentSuccess: readFormBool(formData, "notifyOrderFulfillmentSuccess"),
      depositPaid: readFormBool(formData, "notifyDepositPaid"),
      depositFailed: readFormBool(formData, "notifyDepositFailed"),
    },
  };
  return mergeSiteMailSettings(existing, incoming);
}

export function validateSiteMailInput(input: SiteMailSettings): SiteSettingsFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (input.enabled) {
    if (!input.host.trim()) fieldErrors.host = "Host SMTP wajib diisi.";
    if (!input.username.trim()) fieldErrors.username = "Username SMTP wajib diisi.";
    if (!input.password.trim()) fieldErrors.password = "Password SMTP wajib diisi.";
    if (!input.fromEmail.trim()) {
      fieldErrors.fromEmail = "From email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.fromEmail)) {
      fieldErrors.fromEmail = "From email tidak valid.";
    }
    if (input.replyTo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.replyTo)) {
      fieldErrors.replyTo = "Reply-to tidak valid.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return null;
}

export async function persistSiteMail(input: SiteMailSettings): Promise<void> {
  const current = await getSiteSettings();

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      general: current.general as Prisma.InputJsonValue,
      seo: current.seo as Prisma.InputJsonValue,
      storage: current.storage as Prisma.InputJsonValue,
      style: current.style as Prisma.InputJsonValue,
      pwa: current.pwa as Prisma.InputJsonValue,
      auth: current.auth as Prisma.InputJsonValue,
      cron: current.cron as Prisma.InputJsonValue,
      mail: input as Prisma.InputJsonValue,
    },
    update: {
      mail: input as Prisma.InputJsonValue,
    },
  });
}

export function maskSiteStorageForForm(storage: SiteStorageSettings): SiteStorageSettings {
  return {
    ...storage,
    cloudflareR2: {
      ...storage.cloudflareR2,
      secretAccessKey: storage.cloudflareR2.secretAccessKey ? "••••••••" : "",
    },
  };
}
