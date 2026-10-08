import { ProductStatus } from "@/app/generated/prisma/client";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  checkCoverAlt,
  checkDescription,
  checkKeywords,
  checkOgImage,
  checkSiteUrl,
  checkSitemapPath,
  checkSlug,
  checkTitle,
  checkVerification,
  worstSeverity,
  type SeoFlag,
  type SeoFlagSeverity,
} from "@/lib/seo/seo-rules";
import {
  formatSerpUrl,
  truncateSerpDescription,
  truncateSerpTitle,
} from "@/lib/seo/seo-snippet";

export type SeoEntityKind = "global" | "article" | "product" | "page";

export type SeoEntityReport = {
  id: string;
  kind: SeoEntityKind;
  name: string;
  path: string;
  absoluteUrl: string;
  editHref: string | null;
  viewHref: string;
  title: string;
  description: string;
  snippetTitle: string;
  snippetDescription: string;
  snippetUrl: string;
  severity: SeoFlagSeverity;
  flags: SeoFlag[];
};

export type SeoReportSummary = {
  ok: number;
  warn: number;
  fail: number;
  total: number;
};

export type SeoReport = {
  baseUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  summary: SeoReportSummary;
  global: SeoEntityReport;
  articles: SeoEntityReport[];
  products: SeoEntityReport[];
  pages: SeoEntityReport[];
};

function countSeverity(items: SeoEntityReport[]): SeoReportSummary {
  let ok = 0;
  let warn = 0;
  let fail = 0;
  for (const item of items) {
    if (item.severity === "fail") fail += 1;
    else if (item.severity === "warn") warn += 1;
    else ok += 1;
  }
  return { ok, warn, fail, total: items.length };
}

function buildEntity(input: {
  id: string;
  kind: SeoEntityKind;
  name: string;
  path: string;
  baseUrl: string;
  editHref: string | null;
  title: string;
  description: string;
  flags: SeoFlag[];
}): SeoEntityReport {
  const absoluteUrl = `${input.baseUrl}${input.path}`;
  return {
    id: input.id,
    kind: input.kind,
    name: input.name,
    path: input.path,
    absoluteUrl,
    editHref: input.editHref,
    viewHref: input.path,
    title: input.title,
    description: input.description,
    snippetTitle: truncateSerpTitle(input.title),
    snippetDescription: truncateSerpDescription(input.description),
    snippetUrl: formatSerpUrl(input.baseUrl, input.path),
    severity: worstSeverity(input.flags),
    flags: input.flags,
  };
}

export async function getSeoReport(): Promise<SeoReport> {
  const [settings, baseUrl, articles, products, pages] = await Promise.all([
    getSiteSettings(),
    getAppUrl(),
    prisma.article.findMany({
      where: { isActive: true },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        coverImageAlt: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        ogImageUrl: true,
      },
    }),
    prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        subtitle: true,
        thumbnailUrl: true,
      },
    }),
    prisma.contentPage.findMany({
      where: { isActive: true },
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        showInFooter: true,
      },
    }),
  ]);

  const siteName = settings.general.siteName.trim() || "R9host";
  const seo = settings.seo;

  const sitemapPaths = new Set<string>([
    "/",
    "/produk",
    "/artikel",
    "/promo",
    "/bantuan",
    ...articles.map((a) => `/artikel/${a.slug}`),
    ...products.map((p) => `/produk/${p.slug}`),
    ...pages.filter((p) => p.showInFooter).map((p) => `/halaman/${p.slug}`),
  ]);

  const globalTitle = seo.metaTitle.trim() || siteName;
  const globalDescription = seo.metaDescription.trim();
  const globalFlags: SeoFlag[] = [
    checkSiteUrl(settings.general.siteUrl),
    checkTitle(globalTitle),
    checkDescription(globalDescription),
    checkKeywords(seo.metaKeywords),
    checkOgImage(seo.ogImageUrl),
    checkVerification("Google Search Console", seo.googleSiteVerification),
    checkVerification("Bing Webmaster", seo.bingSiteVerification),
    {
      code: "sitemap.route",
      severity: "ok",
      message: "Route /sitemap.xml tersedia di aplikasi.",
    },
    {
      code: "robots.route",
      severity: "ok",
      message: "Route /robots.txt tersedia di aplikasi.",
    },
  ];

  const global = buildEntity({
    id: "global",
    kind: "global",
    name: "SEO situs",
    path: "/",
    baseUrl,
    editHref: "/console/settings/website?section=seo",
    title: globalTitle,
    description: globalDescription,
    flags: globalFlags,
  });

  const articleReports = articles.map((article) => {
    const path = `/artikel/${article.slug}`;
    const title =
      article.metaTitle?.trim() || `${article.title} — ${siteName}`;
    const description =
      article.metaDescription?.trim() ||
      article.excerpt.trim() ||
      `${article.title} — tips dan panduan top up game di ${siteName}.`;
    const og = article.ogImageUrl?.trim() || article.coverImageUrl;
    const flags: SeoFlag[] = [
      checkTitle(title),
      checkDescription(description),
      checkKeywords(article.metaKeywords ?? ""),
      checkOgImage(og),
      checkSlug(article.slug),
      checkSitemapPath(path, sitemapPaths),
    ];
    const altFlag = checkCoverAlt(article.coverImageUrl, article.coverImageAlt);
    if (altFlag) flags.push(altFlag);

    return buildEntity({
      id: article.id,
      kind: "article",
      name: article.title,
      path,
      baseUrl,
      editHref: `/console/artikel/${article.id}/edit`,
      title,
      description,
      flags,
    });
  });

  const productReports = products.map((product) => {
    const path = `/produk/${product.slug}`;
    const title = `${product.name} — Top Up`;
    const description =
      product.subtitle?.trim() || `Top up ${product.name} instan di ${siteName}.`;
    const flags: SeoFlag[] = [
      checkTitle(title),
      checkDescription(description),
      checkOgImage(product.thumbnailUrl),
      checkSlug(product.slug),
      checkSitemapPath(path, sitemapPaths),
    ];

    return buildEntity({
      id: product.id,
      kind: "product",
      name: product.name,
      path,
      baseUrl,
      editHref: `/console/produk/${product.id}/edit`,
      title,
      description,
      flags,
    });
  });

  const pageReports = pages.map((page) => {
    const path = `/halaman/${page.slug}`;
    const title = `${page.title} — ${siteName}`;
    const description = `${page.title} ${siteName}`;
    const flags: SeoFlag[] = [
      checkTitle(title),
      checkDescription(description),
      checkSlug(page.slug),
      checkSitemapPath(path, sitemapPaths),
    ];
    if (!page.showInFooter) {
      flags.push({
        code: "sitemap.footer",
        severity: "warn",
        message: "Tidak di footer — halaman aktif tidak masuk sitemap otomatis.",
      });
    }

    return buildEntity({
      id: page.id,
      kind: "page",
      name: page.title,
      path,
      baseUrl,
      editHref: `/console/halaman/${page.id}/edit`,
      title,
      description,
      flags,
    });
  });

  const allEntities = [global, ...articleReports, ...productReports, ...pageReports];

  return {
    baseUrl,
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    robotsUrl: `${baseUrl}/robots.txt`,
    summary: countSeverity(allEntities),
    global,
    articles: articleReports,
    products: productReports,
    pages: pageReports,
  };
}
