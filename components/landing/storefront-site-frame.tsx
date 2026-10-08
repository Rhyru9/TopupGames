import type { ReactNode } from "react";
import { StorefrontCompactFooter } from "./storefront-compact-footer";
import { StorefrontFooter } from "./storefront-footer";

type StorefrontSiteFrameProps = {
  children: ReactNode;
  className?: string;
  /** full = footer etalase, compact = checkout/invoice/detail produk */
  footer?: "full" | "compact";
};

/** Wrapper storefront — konten + footer sticky di bawah viewport. */
export function StorefrontSiteFrame({
  children,
  className = "",
  footer = "full",
}: StorefrontSiteFrameProps) {
  return (
    <div className={`storefront-site ${className}`.trim()}>
      {children}
      {footer === "compact" ? <StorefrontCompactFooter /> : <StorefrontFooter />}
    </div>
  );
}
