"use client";

import { useSiteBranding } from "./site-branding-provider";
import { defaultDockLogoUrl } from "@/lib/site-settings/site-settings-schemas";

type BrandLogoProps = {
  variant?: "header" | "footer" | "mark";
  src?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
};

/** Reserve the supplied logo's aspect ratio before the image loads. */
export function BrandLogo({
  variant = "header",
  src,
  alt,
  className = "",
  priority = false,
}: BrandLogoProps) {
  const { logoHeaderUrl, logoFooterUrl, siteName } = useSiteBranding();
  const resolvedSrc = src || (variant === "mark" ? defaultDockLogoUrl : variant === "footer" ? logoFooterUrl : logoHeaderUrl);

  return (
    // Custom branding may use any configured image host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt ?? siteName}
      width={2170}
      height={725}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`brand-logo${variant === "mark" ? " brand-logo--mark" : ""} ${className}`.trim()}
    />
  );
}
