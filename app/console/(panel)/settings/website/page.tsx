import { headers } from "next/headers";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { WebsiteSettingsPanel } from "@/components/console/website/website-settings-panel";
import { getAppUrl } from "@/lib/app-url";
import { getResolvedCronSecret } from "@/lib/cron/get-cron-secret";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  isWebsiteSettingSection,
  maskCloudflareR2Settings,
  maskSiteAuthSettings,
  maskSiteMailSettings,
  type WebsiteSettingSection,
} from "@/lib/site-settings/site-settings-schemas";

type WebsiteSettingsPageProps = {
  searchParams: Promise<{ section?: string }>;
};

function trimSlash(url: string) {
  return url.replace(/\/$/, "");
}

async function resolveGoogleCallbackUrl(siteUrl: string): Promise<string> {
  const fromSite = trimSlash(siteUrl.trim());
  if (fromSite) {
    return `${fromSite}/api/member-auth/callback/google`;
  }

  const fromEnv = (process.env.APP_URL || process.env.AUTH_URL || "").trim();
  if (fromEnv) {
    return `${trimSlash(fromEnv)}/api/member-auth/callback/google`;
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  if (host) {
    return `${proto}://${host}/api/member-auth/callback/google`;
  }

  return "https://your-domain.com/api/member-auth/callback/google";
}

export default async function WebsiteSettingsPage({ searchParams }: WebsiteSettingsPageProps) {
  const { section: sectionParam } = await searchParams;
  const selectedSection: WebsiteSettingSection =
    sectionParam && isWebsiteSettingSection(sectionParam) ? sectionParam : "general";

  const settings = await getSiteSettings();
  const storageForForm = {
    ...settings.storage,
    cloudflareR2: maskCloudflareR2Settings(settings.storage.cloudflareR2),
  };
  const authForForm = maskSiteAuthSettings(settings.auth);
  const mailForForm = maskSiteMailSettings(settings.mail);
  const googleCallbackUrl = await resolveGoogleCallbackUrl(settings.general.siteUrl);
  const cronBaseUrl = await getAppUrl();
  const dbSecret = settings.cron.secret.trim();
  const envSecret = process.env.CRON_SECRET?.trim() || "";
  const resolvedSecret = (await getResolvedCronSecret()) || "";
  const cronSecretConfigured = Boolean(resolvedSecret);
  const cronSecretSource = dbSecret
    ? ("database" as const)
    : envSecret
      ? ("env" as const)
      : ("none" as const);

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Pengaturan"
        title="Website"
        description="Identitas situs, SEO, style, PWA, autentikasi, email SMTP, penyimpanan, dan cron VPS."
      />

      <WebsiteSettingsPanel
        selectedSection={selectedSection}
        general={settings.general}
        seo={settings.seo}
        storage={storageForForm}
        style={settings.style}
        pwa={settings.pwa}
        auth={authForForm}
        mail={mailForForm}
        googleCallbackUrl={googleCallbackUrl}
        cronBaseUrl={cronBaseUrl}
        cronSecretConfigured={cronSecretConfigured}
        cronSecretDisplay={cronSecretConfigured ? resolvedSecret : "ISI_CRON_SECRET"}
        cronSecretSource={cronSecretSource}
      />
    </div>
  );
}
