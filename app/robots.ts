import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
