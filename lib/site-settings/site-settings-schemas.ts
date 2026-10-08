export type SiteGeneralSettings = {
  siteName: string;
  siteUrl: string;
  logoHeaderUrl: string;
  logoFooterUrl: string;
  faviconUrl: string;
  whatsappUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  email: string;
  playStoreUrl: string;
  appStoreUrl: string;
  supportWhatsappEnabled: boolean;
  supportWhatsappNumber: string;
  supportWhatsappMessage: string;
  supportWhatsappLabel: string;
};

export type SiteSeoSettings = {
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  ogImageUrl: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  yandexVerification: string;
  pinterestVerification: string;
  facebookDomainVerification: string;
};

export type StorageDriver = "local" | "cloudflare_r2";

export type LocalStorageSettings = {
  uploadDir: string;
  publicUrlPrefix: string;
};

export type CloudflareR2Settings = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
  endpoint: string;
};

export type SiteStorageSettings = {
  driver: StorageDriver;
  local: LocalStorageSettings;
  cloudflareR2: CloudflareR2Settings;
};

export type GridColumnCount = 2 | 3 | 4 | 5 | 6;

export type GridBreakpointCols = {
  mobile: GridColumnCount;
  tablet: GridColumnCount;
  desktop: GridColumnCount;
};

export type GridGapDensity = "tight" | "normal" | "relaxed";

export type FlashSaleSlidesPerView = {
  mobile: number;
  tablet: number;
  desktop: number;
};

export type SiteStyleSettings = {
  popular: { columns: GridBreakpointCols; gap: GridGapDensity };
  catalog: { columns: GridBreakpointCols; pageRows: number; gap: GridGapDensity };
  flashSale: { slidesPerView: FlashSaleSlidesPerView };
};

export type SitePwaSettings = {
  enabled: boolean;
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  iconUrl: string;
};

export type SiteAuthSettings = {
  googleEnabled: boolean;
  googleClientId: string;
  googleClientSecret: string;
};

export type SiteCronSettings = {
  secret: string;
};

export type SiteMailNotificationSettings = {
  memberVerify: boolean;
  passwordReset: boolean;
  orderCreated: boolean;
  orderPaid: boolean;
  orderFailed: boolean;
  orderFulfillmentFailed: boolean;
  orderFulfillmentSuccess: boolean;
  depositPaid: boolean;
  depositFailed: boolean;
};

export type SiteMailSettings = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  notifications: SiteMailNotificationSettings;
};

export type SiteSettingsData = {
  general: SiteGeneralSettings;
  seo: SiteSeoSettings;
  storage: SiteStorageSettings;
  style: SiteStyleSettings;
  pwa: SitePwaSettings;
  auth: SiteAuthSettings;
  cron: SiteCronSettings;
  mail: SiteMailSettings;
};

export const defaultSiteGeneral: SiteGeneralSettings = {
  siteName: "R9host",
  siteUrl: "",
  logoHeaderUrl: "",
  logoFooterUrl: "",
  faviconUrl: "/brand/r9host-icon-32.png",
  whatsappUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  facebookUrl: "",
  email: "",
  playStoreUrl: "",
  appStoreUrl: "",
  supportWhatsappEnabled: false,
  supportWhatsappNumber: "",
  supportWhatsappMessage: "Halo R9host, saya butuh bantuan terkait top up.",
  supportWhatsappLabel: "Chat CS",
};

export const defaultLogoHeaderUrl = "/brand/r9host-logo.png";
export const defaultLogoFooterUrl = "/brand/r9host-logo.png";
export const defaultDockLogoUrl = "/brand/r9host-logo.png";

export const defaultPwaIconUrl = "/brand/r9host-icon-512.png";
export const defaultAppleIconUrl = "/brand/r9host-icon-180.png";

/** Resolve known assets from the previous brand while preserving custom uploads. */
export function resolveBrandAssetUrl(value: string, fallback: string): string {
  const url = value.trim();
  const legacy = ["/pavicon.ico", "/favicon.ico"];
  return !url || legacy.includes(url.split(/[?#]/)[0]) ? fallback : url;
}

export function resolveLogoHeaderUrl(general: SiteGeneralSettings): string {
  return resolveBrandAssetUrl(general.logoHeaderUrl, defaultLogoHeaderUrl);
}

export function resolveLogoFooterUrl(general: SiteGeneralSettings): string {
  return resolveBrandAssetUrl(general.logoFooterUrl, defaultLogoFooterUrl);
}

export function resolveDockLogoUrl(general: SiteGeneralSettings): string {
  return resolveLogoHeaderUrl(general);
}

export const defaultSiteSeo: SiteSeoSettings = {
  metaTitle: "R9host — Top Up Game Instant",
  metaKeywords: "top up game, mobile legends, free fire, r9host",
  metaDescription:
    "Top up Mobile Legends, Free Fire, dan ratusan game. Cepat, aman, harga final.",
  ogImageUrl: "/brand/r9host-og.jpg",
  googleAnalyticsId: "",
  googleTagManagerId: "",
  googleSiteVerification: "",
  bingSiteVerification: "",
  yandexVerification: "",
  pinterestVerification: "",
  facebookDomainVerification: "",
};

export function resolveSiteDescription(seo: SiteSeoSettings): string {
  return seo.metaDescription.trim() || defaultSiteSeo.metaDescription;
}

export const defaultSiteStorage: SiteStorageSettings = {
  driver: "local",
  local: {
    uploadDir: "",
    publicUrlPrefix: "/uploads",
  },
  cloudflareR2: {
    accountId: "",
    accessKeyId: "",
    secretAccessKey: "",
    bucket: "",
    publicBaseUrl: "",
    endpoint: "",
  },
};

export const defaultSiteStyle: SiteStyleSettings = {
  popular: {
    columns: { mobile: 3, tablet: 4, desktop: 6 },
    gap: "normal",
  },
  catalog: {
    columns: { mobile: 3, tablet: 6, desktop: 6 },
    pageRows: 3,
    gap: "normal",
  },
  flashSale: {
    slidesPerView: { mobile: 1.8, tablet: 3.5, desktop: 5.1 },
  },
};

export const defaultSitePwa: SitePwaSettings = {
  enabled: false,
  name: "R9host",
  shortName: "R9host",
  description: defaultSiteSeo.metaDescription,
  themeColor: "#ff7a1a",
  backgroundColor: "#050505",
  iconUrl: "",
};

export const defaultSiteAuth: SiteAuthSettings = {
  googleEnabled: false,
  googleClientId: "",
  googleClientSecret: "",
};

export const defaultSiteCron: SiteCronSettings = {
  secret: "",
};

export const defaultSiteMailNotifications: SiteMailNotificationSettings = {
  memberVerify: true,
  passwordReset: true,
  orderCreated: true,
  orderPaid: true,
  orderFailed: true,
  orderFulfillmentFailed: true,
  orderFulfillmentSuccess: true,
  depositPaid: true,
  depositFailed: true,
};

export const defaultSiteMail: SiteMailSettings = {
  enabled: false,
  host: "",
  port: 587,
  secure: false,
  username: "",
  password: "",
  fromEmail: "",
  fromName: "R9host",
  replyTo: "",
  notifications: defaultSiteMailNotifications,
};

export const websiteSettingSections = [
  { slug: "general", label: "Umum", description: "Identitas & kontak" },
  { slug: "seo", label: "SEO", description: "Meta, OG & Webmaster" },
  { slug: "style", label: "Style", description: "Kolom section landing" },
  { slug: "pwa", label: "PWA", description: "Install aplikasi" },
  { slug: "auth", label: "Autentikasi", description: "Login Google & OAuth" },
  { slug: "mail", label: "Email / SMTP", description: "SMTP & notifikasi" },
  { slug: "storage", label: "Penyimpanan", description: "Local atau Cloudflare R2" },
  { slug: "cron", label: "Cron jobs", description: "cPanel, CloudPanel, VPS…" },
] as const;

export type WebsiteSettingSection = (typeof websiteSettingSections)[number]["slug"];

export function isWebsiteSettingSection(value: string): value is WebsiteSettingSection {
  return websiteSettingSections.some((section) => section.slug === value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

export function parseSiteGeneral(value: unknown): SiteGeneralSettings {
  const record = asRecord(value);
  return {
    siteName: readString(record, "siteName", defaultSiteGeneral.siteName),
    siteUrl: readString(record, "siteUrl"),
    logoHeaderUrl: readString(record, "logoHeaderUrl"),
    logoFooterUrl: readString(record, "logoFooterUrl"),
    faviconUrl: readString(record, "faviconUrl", defaultSiteGeneral.faviconUrl),
    whatsappUrl: readString(record, "whatsappUrl"),
    instagramUrl: readString(record, "instagramUrl"),
    tiktokUrl: readString(record, "tiktokUrl"),
    youtubeUrl: readString(record, "youtubeUrl"),
    facebookUrl: readString(record, "facebookUrl"),
    email: readString(record, "email"),
    playStoreUrl: readString(record, "playStoreUrl"),
    appStoreUrl: readString(record, "appStoreUrl"),
    supportWhatsappEnabled:
      record.supportWhatsappEnabled === true ||
      record.supportWhatsappEnabled === "true" ||
      record.supportWhatsappEnabled === 1,
    supportWhatsappNumber: readString(record, "supportWhatsappNumber"),
    supportWhatsappMessage: readString(
      record,
      "supportWhatsappMessage",
      defaultSiteGeneral.supportWhatsappMessage,
    ),
    supportWhatsappLabel: readString(
      record,
      "supportWhatsappLabel",
      defaultSiteGeneral.supportWhatsappLabel,
    ),
  };
}

/** Normalize phone to international digits for wa.me (e.g. 62812...). */
export function normalizeWhatsAppPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.startsWith("8") && digits.length >= 9 && digits.length <= 13) {
    digits = `62${digits}`;
  }
  return digits;
}

export function buildWhatsAppChatUrl(phone: string, message: string): string | null {
  const digits = normalizeWhatsAppPhone(phone);
  if (!digits || digits.length < 10) return null;
  const text = message.trim();
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}

export function parseSiteSeo(value: unknown): SiteSeoSettings {
  const record = asRecord(value);
  return {
    metaTitle: readString(record, "metaTitle", defaultSiteSeo.metaTitle),
    metaKeywords: readString(record, "metaKeywords", defaultSiteSeo.metaKeywords),
    metaDescription: readString(record, "metaDescription", defaultSiteSeo.metaDescription),
    ogImageUrl: readString(record, "ogImageUrl"),
    googleAnalyticsId: readString(record, "googleAnalyticsId"),
    googleTagManagerId: readString(record, "googleTagManagerId"),
    googleSiteVerification: readString(record, "googleSiteVerification"),
    bingSiteVerification: readString(record, "bingSiteVerification"),
    yandexVerification: readString(record, "yandexVerification"),
    pinterestVerification: readString(record, "pinterestVerification"),
    facebookDomainVerification: readString(record, "facebookDomainVerification"),
  };
}

export function parseLocalStorageSettings(value: unknown): LocalStorageSettings {
  const record = asRecord(value);
  return {
    uploadDir: readString(record, "uploadDir"),
    publicUrlPrefix: readString(record, "publicUrlPrefix", defaultSiteStorage.local.publicUrlPrefix),
  };
}

export function parseCloudflareR2Settings(value: unknown): CloudflareR2Settings {
  const record = asRecord(value);
  return {
    accountId: readString(record, "accountId"),
    accessKeyId: readString(record, "accessKeyId"),
    secretAccessKey: readString(record, "secretAccessKey"),
    bucket: readString(record, "bucket"),
    publicBaseUrl: readString(record, "publicBaseUrl"),
    endpoint: readString(record, "endpoint"),
  };
}

export function parseSiteStorage(value: unknown): SiteStorageSettings {
  const record = asRecord(value);
  const driver = readString(record, "driver", defaultSiteStorage.driver);
  return {
    driver: driver === "cloudflare_r2" ? "cloudflare_r2" : "local",
    local: parseLocalStorageSettings(record.local),
    cloudflareR2: parseCloudflareR2Settings(record.cloudflareR2),
  };
}

function readColumnCount(
  record: Record<string, unknown>,
  key: string,
  fallback: GridColumnCount,
): GridColumnCount {
  const value = record[key];
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (n === 2 || n === 3 || n === 4 || n === 5 || n === 6) return n;
  return fallback;
}

function parseGridBreakpointCols(
  value: unknown,
  fallback: GridBreakpointCols,
): GridBreakpointCols {
  const record = asRecord(value);
  return {
    mobile: readColumnCount(record, "mobile", fallback.mobile),
    tablet: readColumnCount(record, "tablet", fallback.tablet),
    desktop: readColumnCount(record, "desktop", fallback.desktop),
  };
}

function parseGridGapDensity(value: unknown, fallback: GridGapDensity): GridGapDensity {
  if (value === "tight" || value === "normal" || value === "relaxed") return value;
  return fallback;
}

function parseSlidesPerView(
  value: unknown,
  fallback: FlashSaleSlidesPerView,
): FlashSaleSlidesPerView {
  const record = asRecord(value);
  function readSlide(key: keyof FlashSaleSlidesPerView): number {
    const raw = Number(record[key]);
    if (!Number.isFinite(raw) || raw < 1 || raw > 8) return fallback[key];
    return Math.round(raw * 10) / 10;
  }
  return {
    mobile: readSlide("mobile"),
    tablet: readSlide("tablet"),
    desktop: readSlide("desktop"),
  };
}

export function parseSiteStyle(value: unknown): SiteStyleSettings {
  const record = asRecord(value);
  const popular = asRecord(record.popular);
  const catalog = asRecord(record.catalog);
  const flashSale = asRecord(record.flashSale);
  const pageRowsRaw = Number.parseInt(String(catalog.pageRows ?? ""), 10);
  const pageRows =
    Number.isFinite(pageRowsRaw) && pageRowsRaw >= 1 && pageRowsRaw <= 6
      ? pageRowsRaw
      : defaultSiteStyle.catalog.pageRows;

  return {
    popular: {
      columns: parseGridBreakpointCols(popular.columns, defaultSiteStyle.popular.columns),
      gap: parseGridGapDensity(popular.gap, defaultSiteStyle.popular.gap),
    },
    catalog: {
      columns: parseGridBreakpointCols(catalog.columns, defaultSiteStyle.catalog.columns),
      pageRows,
      gap: parseGridGapDensity(catalog.gap, defaultSiteStyle.catalog.gap),
    },
    flashSale: {
      slidesPerView: parseSlidesPerView(
        flashSale.slidesPerView,
        defaultSiteStyle.flashSale.slidesPerView,
      ),
    },
  };
}

function readHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function parseSitePwa(value: unknown): SitePwaSettings {
  const record = asRecord(value);
  return {
    enabled: record.enabled === true || record.enabled === "true" || record.enabled === 1,
    name: readString(record, "name", defaultSitePwa.name),
    shortName: readString(record, "shortName", defaultSitePwa.shortName),
    description: readString(record, "description", defaultSitePwa.description),
    themeColor: readHexColor(record.themeColor, defaultSitePwa.themeColor),
    backgroundColor: readHexColor(record.backgroundColor, defaultSitePwa.backgroundColor),
    iconUrl: readString(record, "iconUrl"),
  };
}

export function parseSiteAuth(value: unknown): SiteAuthSettings {
  const record = asRecord(value);
  return {
    googleEnabled:
      record.googleEnabled === true ||
      record.googleEnabled === "true" ||
      record.googleEnabled === 1,
    googleClientId: readString(record, "googleClientId"),
    googleClientSecret: readString(record, "googleClientSecret"),
  };
}

export function parseSiteCron(value: unknown): SiteCronSettings {
  const record = asRecord(value);
  return {
    secret: readString(record, "secret"),
  };
}

function readBool(record: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = record[key];
  if (value === true || value === "true" || value === 1) return true;
  if (value === false || value === "false" || value === 0) return false;
  return fallback;
}

function parseSiteMailNotifications(value: unknown): SiteMailNotificationSettings {
  const record = asRecord(value);
  return {
    memberVerify: readBool(record, "memberVerify", defaultSiteMailNotifications.memberVerify),
    passwordReset: readBool(record, "passwordReset", defaultSiteMailNotifications.passwordReset),
    orderCreated: readBool(record, "orderCreated", defaultSiteMailNotifications.orderCreated),
    orderPaid: readBool(record, "orderPaid", defaultSiteMailNotifications.orderPaid),
    orderFailed: readBool(record, "orderFailed", defaultSiteMailNotifications.orderFailed),
    orderFulfillmentFailed: readBool(
      record,
      "orderFulfillmentFailed",
      defaultSiteMailNotifications.orderFulfillmentFailed,
    ),
    orderFulfillmentSuccess: readBool(
      record,
      "orderFulfillmentSuccess",
      defaultSiteMailNotifications.orderFulfillmentSuccess,
    ),
    depositPaid: readBool(record, "depositPaid", defaultSiteMailNotifications.depositPaid),
    depositFailed: readBool(record, "depositFailed", defaultSiteMailNotifications.depositFailed),
  };
}

export function parseSiteMail(value: unknown): SiteMailSettings {
  const record = asRecord(value);
  const portRaw = Number.parseInt(String(record.port ?? defaultSiteMail.port), 10);
  const port =
    Number.isFinite(portRaw) && portRaw >= 1 && portRaw <= 65535
      ? portRaw
      : defaultSiteMail.port;

  return {
    enabled: readBool(record, "enabled"),
    host: readString(record, "host"),
    port,
    secure: readBool(record, "secure"),
    username: readString(record, "username"),
    password: readString(record, "password"),
    fromEmail: readString(record, "fromEmail"),
    fromName: readString(record, "fromName", defaultSiteMail.fromName),
    replyTo: readString(record, "replyTo"),
    notifications: parseSiteMailNotifications(record.notifications),
  };
}

export function isMailConfigured(mail: SiteMailSettings): boolean {
  return Boolean(
    mail.enabled &&
      mail.host.trim() &&
      mail.port >= 1 &&
      mail.username.trim() &&
      mail.password.trim() &&
      mail.fromEmail.trim(),
  );
}

export function maskSiteMailSettings(mail: SiteMailSettings): SiteMailSettings {
  return {
    ...mail,
    password: mail.password ? "••••••••" : "",
  };
}

export function mergeSiteMailSettings(
  existing: SiteMailSettings,
  incoming: SiteMailSettings,
): SiteMailSettings {
  return {
    enabled: incoming.enabled,
    host: incoming.host.trim() || existing.host,
    port: incoming.port || existing.port,
    secure: incoming.secure,
    username: incoming.username.trim() || existing.username,
    password:
      incoming.password && incoming.password !== "••••••••"
        ? incoming.password.trim()
        : existing.password,
    fromEmail: incoming.fromEmail.trim() || existing.fromEmail,
    fromName: incoming.fromName.trim() || existing.fromName,
    replyTo: incoming.replyTo.trim(),
    notifications: incoming.notifications,
  };
}

export function isGoogleLoginConfigured(auth: SiteAuthSettings): boolean {
  return Boolean(
    auth.googleEnabled && auth.googleClientId.trim() && auth.googleClientSecret.trim(),
  );
}

export function maskSiteAuthSettings(auth: SiteAuthSettings): SiteAuthSettings {
  return {
    ...auth,
    googleClientSecret: auth.googleClientSecret ? "••••••••" : "",
  };
}

export function mergeSiteAuthSettings(
  existing: SiteAuthSettings,
  incoming: SiteAuthSettings,
): SiteAuthSettings {
  return {
    googleEnabled: incoming.googleEnabled,
    googleClientId: incoming.googleClientId.trim() || existing.googleClientId,
    googleClientSecret:
      incoming.googleClientSecret && incoming.googleClientSecret !== "••••••••"
        ? incoming.googleClientSecret.trim()
        : existing.googleClientSecret,
  };
}

export function resolvePwaDisplaySettings(settings: SiteSettingsData): SitePwaSettings {
  const { pwa, general, seo } = settings;
  const customFavicon = general.faviconUrl.trim() === defaultSiteGeneral.faviconUrl ? "" : general.faviconUrl;
  const iconUrl = resolveBrandAssetUrl(pwa.iconUrl.trim() || customFavicon, defaultPwaIconUrl);

  return {
    enabled: pwa.enabled,
    name: pwa.name.trim() || general.siteName.trim() || defaultSitePwa.name,
    shortName: pwa.shortName.trim() || general.siteName.trim() || defaultSitePwa.shortName,
    description:
      pwa.description.trim() || seo.metaDescription.trim() || defaultSitePwa.description,
    themeColor: pwa.themeColor || defaultSitePwa.themeColor,
    backgroundColor: pwa.backgroundColor || defaultSitePwa.backgroundColor,
    iconUrl,
  };
}

export function parseSiteSettingsRow(row: {
  general: unknown;
  seo: unknown;
  storage: unknown;
  style?: unknown;
  pwa?: unknown;
  auth?: unknown;
  cron?: unknown;
  mail?: unknown;
}): SiteSettingsData {
  return {
    general: parseSiteGeneral(row.general),
    seo: parseSiteSeo(row.seo),
    storage: parseSiteStorage(row.storage),
    style: parseSiteStyle(row.style),
    pwa: parseSitePwa(row.pwa),
    auth: parseSiteAuth(row.auth),
    cron: parseSiteCron(row.cron),
    mail: parseSiteMail(row.mail),
  };
}

export function isStorageConfigured(storage: SiteStorageSettings): boolean {
  if (storage.driver === "local") return true;

  const r2 = storage.cloudflareR2;
  return Boolean(
    r2.accountId.trim() &&
      r2.accessKeyId.trim() &&
      r2.secretAccessKey.trim() &&
      r2.bucket.trim() &&
      r2.publicBaseUrl.trim(),
  );
}

export function maskCloudflareR2Settings(
  settings: CloudflareR2Settings,
): CloudflareR2Settings {
  return {
    ...settings,
    secretAccessKey: settings.secretAccessKey ? "••••••••" : "",
  };
}

export function mergeCloudflareR2Settings(
  existing: CloudflareR2Settings,
  incoming: CloudflareR2Settings,
): CloudflareR2Settings {
  return {
    accountId: incoming.accountId || existing.accountId,
    accessKeyId: incoming.accessKeyId || existing.accessKeyId,
    secretAccessKey:
      incoming.secretAccessKey && incoming.secretAccessKey !== "••••••••"
        ? incoming.secretAccessKey
        : existing.secretAccessKey,
    bucket: incoming.bucket || existing.bucket,
    publicBaseUrl: incoming.publicBaseUrl || existing.publicBaseUrl,
    endpoint: incoming.endpoint || existing.endpoint,
  };
}
