import { getAppUrl } from "@/lib/app-url";
import type { PublicArticleDetail } from "@/lib/article/article-form";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { defaultSiteGeneral, resolveLogoHeaderUrl } from "@/lib/site-settings/site-settings-schemas";

export async function buildArticleJsonLd(article: PublicArticleDetail) {
  const [settings, baseUrl] = await Promise.all([getSiteSettings().catch(() => null), getAppUrl()]);

  const siteName = settings?.general.siteName.trim() ?? defaultSiteGeneral.siteName;
  const general = settings?.general ?? defaultSiteGeneral;
  const logoUrl = resolveLogoHeaderUrl(general);
  const authorName = article.authorName?.trim() || siteName;
  const image = article.ogImageUrl?.trim() || article.coverImageUrl;
  const url = `${baseUrl}/artikel/${article.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription?.trim() || article.excerpt,
    image: [image],
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: logoUrl.startsWith("http") ? logoUrl : `${baseUrl}${logoUrl}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
  };
}
