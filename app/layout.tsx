import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans } from "next/font/google";
import { InlineScript } from "@/components/inline-script";
import { MobileDock } from "@/components/nav/mobile-dock";
import { NavigationProgress } from "@/components/nav/navigation-progress";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { GoogleTags } from "@/components/site/google-tags";
import { SiteBrandingProvider } from "@/components/site/site-branding-provider";
import { WhatsappFloat } from "@/components/support/whatsapp-float";
import { getAppUrl, toAbsoluteUrl } from "@/lib/app-url";
import { CONSOLE_INIT_SCRIPT } from "@/lib/console-theme";
import { getMemberSession } from "@/lib/member-auth";
import { hasActiveStorefrontPromo } from "@/lib/promo/has-active-storefront-promo";
import { getFooterContentPages } from "@/lib/content/get-footer-content-pages";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  buildWhatsAppChatUrl,
  defaultDockLogoUrl,
  defaultAppleIconUrl,
  defaultPwaIconUrl,
  resolveBrandAssetUrl,
  defaultSiteGeneral,
  defaultSitePwa,
  defaultSiteSeo,
  resolveDockLogoUrl,
  resolveLogoFooterUrl,
  resolveLogoHeaderUrl,
  resolveSiteDescription,
  resolvePwaDisplaySettings,
} from "@/lib/site-settings/site-settings-schemas";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export async function generateViewport(): Promise<Viewport> {
  try {
    const settings = await getSiteSettings();
    const pwa = resolvePwaDisplaySettings(settings);
    return { themeColor: pwa.themeColor };
  } catch {
    return { themeColor: defaultSitePwa.themeColor };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [settings, baseUrl] = await Promise.all([getSiteSettings(), getAppUrl()]);
    const seo = settings.seo;
    const general = settings.general;
    const pwa = resolvePwaDisplaySettings(settings);

    const title = seo.metaTitle || defaultSiteSeo.metaTitle;
    const description = seo.metaDescription || defaultSiteSeo.metaDescription;
    const favicon = resolveBrandAssetUrl(general.faviconUrl, defaultSiteGeneral.faviconUrl);
    const ogImage = toAbsoluteUrl(baseUrl, resolveBrandAssetUrl(seo.ogImageUrl, defaultSiteSeo.ogImageUrl));
    const faviconAbs = favicon.startsWith("/") ? toAbsoluteUrl(baseUrl, favicon) : favicon;
    const appleIcon = pwa.iconUrl === defaultPwaIconUrl ? defaultAppleIconUrl : pwa.iconUrl;
    const pwaIconAbs = appleIcon.startsWith("/") ? toAbsoluteUrl(baseUrl, appleIcon) : appleIcon;

    const verificationOther: Record<string, string> = {};
    if (seo.bingSiteVerification) verificationOther["msvalidate.01"] = seo.bingSiteVerification;
    if (seo.pinterestVerification) verificationOther["p:domain_verify"] = seo.pinterestVerification;
    if (seo.facebookDomainVerification) {
      verificationOther["facebook-domain-verification"] = seo.facebookDomainVerification;
    }

    return {
      metadataBase: new URL(baseUrl),
      title,
      description,
      keywords: seo.metaKeywords || defaultSiteSeo.metaKeywords,
      applicationName: pwa.name,
      appleWebApp: pwa.enabled
        ? {
            capable: true,
            title: pwa.shortName,
            statusBarStyle: "black-translucent",
          }
        : undefined,
      openGraph: {
        type: "website",
        url: baseUrl,
        siteName: general.siteName.trim() || defaultSiteGeneral.siteName,
        title,
        description,
        ...(ogImage
          ? {
              images: [
                {
                  url: ogImage,
                  width: 1200,
                  height: 630,
                  alt: title,
                  type: ogImage.toLowerCase().endsWith(".jpg") || ogImage.toLowerCase().endsWith(".jpeg")
                    ? "image/jpeg"
                    : ogImage.toLowerCase().endsWith(".png")
                      ? "image/png"
                      : undefined,
                },
              ],
            }
          : {}),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
      verification: {
        ...(seo.googleSiteVerification ? { google: seo.googleSiteVerification } : {}),
        ...(seo.yandexVerification ? { yandex: seo.yandexVerification } : {}),
        ...(Object.keys(verificationOther).length > 0 ? { other: verificationOther } : {}),
      },
      icons: {
        icon: faviconAbs,
        shortcut: faviconAbs,
        apple: pwaIconAbs,
      },
      other: pwa.enabled
        ? {
            "mobile-web-app-capable": "yes",
          }
        : undefined,
    };
  } catch {
    return {
      title: defaultSiteSeo.metaTitle,
      description: defaultSiteSeo.metaDescription,
      openGraph: { images: [{ url: defaultSiteSeo.ogImageUrl, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: [defaultSiteSeo.ogImageUrl] },
      icons: {
        icon: defaultSiteGeneral.faviconUrl,
        shortcut: defaultSiteGeneral.faviconUrl,
        apple: defaultAppleIconUrl,
      },
    };
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const pathname = (await headers()).get("x-r9host-pathname") ?? "";
  const isConsole = pathname.startsWith("/console");

  let pwaEnabled = false;
  let dockLogoUrl = defaultDockLogoUrl;
  let logoHeaderUrl = resolveLogoHeaderUrl(defaultSiteGeneral);
  let logoFooterUrl = resolveLogoFooterUrl(defaultSiteGeneral);
  let siteName = defaultSiteGeneral.siteName;
  let siteDescription = resolveSiteDescription(defaultSiteSeo);
  let siteContact = {
    email: defaultSiteGeneral.email,
    whatsappUrl: defaultSiteGeneral.whatsappUrl,
    instagramUrl: defaultSiteGeneral.instagramUrl,
    tiktokUrl: defaultSiteGeneral.tiktokUrl,
    youtubeUrl: defaultSiteGeneral.youtubeUrl,
    facebookUrl: defaultSiteGeneral.facebookUrl,
  };
  let playStoreUrl = defaultSiteGeneral.playStoreUrl;
  let appStoreUrl = defaultSiteGeneral.appStoreUrl;
  let footerPages: Awaited<ReturnType<typeof getFooterContentPages>> = [];
  let whatsappHref: string | null = null;
  let whatsappLabel = defaultSiteGeneral.supportWhatsappLabel;
  let isMember = false;
  let showPromoDot = false;
  let showBantuan = false;
  let googleAnalyticsId = "";
  let googleTagManagerId = "";

  try {
    const settings = await getSiteSettings();
    pwaEnabled = !isConsole && settings.pwa.enabled;
    const general = settings.general;
    logoHeaderUrl = resolveLogoHeaderUrl(general);
    logoFooterUrl = resolveLogoFooterUrl(general);
    siteName = general.siteName.trim() || defaultSiteGeneral.siteName;
    siteDescription = resolveSiteDescription(settings.seo);
    googleAnalyticsId = settings.seo.googleAnalyticsId;
    googleTagManagerId = settings.seo.googleTagManagerId;
    siteContact = {
      email: general.email,
      whatsappUrl: general.whatsappUrl,
      instagramUrl: general.instagramUrl,
      tiktokUrl: general.tiktokUrl,
      youtubeUrl: general.youtubeUrl,
      facebookUrl: general.facebookUrl,
    };
    playStoreUrl = general.playStoreUrl;
    appStoreUrl = general.appStoreUrl;
    dockLogoUrl = resolveDockLogoUrl(general);
    if (
      !isConsole &&
      general.supportWhatsappEnabled &&
      general.supportWhatsappNumber.trim()
    ) {
      whatsappHref = buildWhatsAppChatUrl(
        general.supportWhatsappNumber,
        general.supportWhatsappMessage || defaultSiteGeneral.supportWhatsappMessage,
      );
      whatsappLabel = general.supportWhatsappLabel || defaultSiteGeneral.supportWhatsappLabel;
      showBantuan = true;
    }
  } catch {
    pwaEnabled = false;
  }

  if (!isConsole) {
    try {
      footerPages = await getFooterContentPages();
    } catch {
      footerPages = [];
    }

    try {
      const session = await getMemberSession();
      isMember = Boolean(session?.user?.id);
    } catch {
      isMember = false;
    }

    try {
      showPromoDot = await hasActiveStorefrontPromo();
    } catch {
      showPromoDot = false;
    }
  }

  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-ink text-chrome">
        <InlineScript html={CONSOLE_INIT_SCRIPT} />
        <NavigationProgress />
        {!isConsole ? (
          <GoogleTags
            googleAnalyticsId={googleAnalyticsId}
            googleTagManagerId={googleTagManagerId}
          />
        ) : null}
        <SiteBrandingProvider
          logoHeaderUrl={logoHeaderUrl}
          logoFooterUrl={logoFooterUrl}
          siteName={siteName}
          siteDescription={siteDescription}
          playStoreUrl={playStoreUrl}
          appStoreUrl={appStoreUrl}
          footerPages={footerPages}
          contact={siteContact}
        >
          {children}
        </SiteBrandingProvider>
        {!isConsole ? (
          <>
            <MobileDock
              logoUrl={dockLogoUrl}
              isMember={isMember}
              showPromoDot={showPromoDot}
              showBantuan={showBantuan}
            />
            {whatsappHref ? <WhatsappFloat href={whatsappHref} label={whatsappLabel} /> : null}
            <PwaRegister enabled={pwaEnabled} />
          </>
        ) : null}
      </body>
    </html>
  );
}
