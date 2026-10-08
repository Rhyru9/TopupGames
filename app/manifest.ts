import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  defaultSitePwa,
  defaultPwaIconUrl,
  resolvePwaDisplaySettings,
} from "@/lib/site-settings/site-settings-schemas";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  try {
    const settings = await getSiteSettings();
    const pwa = resolvePwaDisplaySettings(settings);
    const icons: MetadataRoute.Manifest["icons"] = pwa.iconUrl === defaultPwaIconUrl
      ? [
          { src: "/brand/r9host-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: defaultPwaIconUrl, sizes: "512x512", type: "image/png", purpose: "any" },
        ]
      : [{ src: pwa.iconUrl, purpose: "any" }];

    return {
      name: pwa.name,
      short_name: pwa.shortName.slice(0, 12),
      description: pwa.description,
      start_url: "/",
      display: "standalone",
      background_color: pwa.backgroundColor,
      theme_color: pwa.themeColor,
      lang: "id",
      ...(icons ? { icons } : {}),
    };
  } catch {
    return {
      icons: [
        { src: "/brand/r9host-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: defaultPwaIconUrl, sizes: "512x512", type: "image/png", purpose: "any" },
      ],
      name: defaultSitePwa.name,
      short_name: defaultSitePwa.shortName.slice(0, 12),
      description: defaultSitePwa.description,
      start_url: "/",
      display: "standalone",
      background_color: defaultSitePwa.backgroundColor,
      theme_color: defaultSitePwa.themeColor,
      lang: "id",
    };
  }
}
