import type { MetadataRoute } from "next";
import { ProductStatus } from "@/app/generated/prisma/client";
import { getAppUrl } from "@/lib/app-url";
import { getActiveArticleSlugs } from "@/lib/article/get-latest-articles";
import { getFooterContentPages } from "@/lib/content/get-footer-content-pages";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getAppUrl();
  const now = new Date();

  const [articles, footerPages, products] = await Promise.all([
    getActiveArticleSlugs(),
    getFooterContentPages(),
    prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/produk`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/artikel`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/promo`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/bantuan`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/artikel/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const pageRoutes: MetadataRoute.Sitemap = footerPages.map((page) => ({
    url: `${baseUrl}/halaman/${page.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/produk/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticRoutes, ...articleRoutes, ...pageRoutes, ...productRoutes];
}
