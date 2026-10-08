import type { Metadata } from "next";
import { getAppUrl, toAbsoluteUrl } from "@/lib/app-url";
import type { PublicArticleDetail } from "@/lib/article/article-form";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { defaultSiteGeneral } from "@/lib/site-settings/site-settings-schemas";

type BuildArticleMetadataOptions = {
  article: PublicArticleDetail;
  siteName?: string;
  baseUrl?: string;
};

export async function buildArticleMetadata({
  article,
  siteName: siteNameOverride,
  baseUrl: baseUrlOverride,
}: BuildArticleMetadataOptions): Promise<Metadata> {
  const [settings, baseUrl] = await Promise.all([
    siteNameOverride ? Promise.resolve(null) : getSiteSettings().catch(() => null),
    baseUrlOverride ? Promise.resolve(baseUrlOverride) : getAppUrl(),
  ]);

  const siteName =
    siteNameOverride ?? settings?.general.siteName.trim() ?? defaultSiteGeneral.siteName;
  const title = article.metaTitle?.trim() || `${article.title} — ${siteName}`;
  const description =
    article.metaDescription?.trim() ||
    article.excerpt.trim() ||
    `${article.title} — tips dan panduan top up game di ${siteName}.`;
  const keywords = article.metaKeywords?.trim() || undefined;
  const ogImageRaw = article.ogImageUrl?.trim() || article.coverImageUrl;
  const ogImage = ogImageRaw ? toAbsoluteUrl(baseUrl, ogImageRaw) : "";
  const canonical = `${baseUrl}/artikel/${article.slug}`;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(baseUrl),
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: article.authorName ? [article.authorName] : undefined,
      images: ogImage ? [{ url: ogImage, alt: article.coverImageAlt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export async function buildArticleListingMetadata(): Promise<Metadata> {
  const [settings, baseUrl] = await Promise.all([
    getSiteSettings().catch(() => null),
    getAppUrl(),
  ]);

  const siteName = settings?.general.siteName.trim() ?? defaultSiteGeneral.siteName;
  const title = `Artikel & Tips Top Up Game — ${siteName}`;
  const description =
    "Panduan top up game, tips hemat diamond, dan info promo terbaru untuk Mobile Legends, Free Fire, dan game populer lainnya.";

  return {
    title,
    description,
    keywords: "artikel top up game, tips mobile legends, free fire, panduan top up",
    alternates: { canonical: `${baseUrl}/artikel` },
    openGraph: {
      type: "website",
      url: `${baseUrl}/artikel`,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
