"use client";

import type { ReactNode } from "react";
import { HeaderFx } from "./header-fx";
import { StorefrontFooter } from "./storefront-footer";

type StorefrontPageShellProps = {
  children: ReactNode;
  className?: string;
  showFooter?: boolean;
};

/** Latar belakang storefront konsisten dengan homepage (grid, vignette, scanlines). */
export function StorefrontPageShell({
  children,
  className = "",
  showFooter = true,
}: StorefrontPageShellProps) {
  return (
    <div className={`storefront-shell bg-ink ${className}`.trim()}>
      <div className="storefront-shell__fx" aria-hidden />
      <HeaderFx />
      <div className="storefront-shell__body">
        {children}
        {showFooter ? <StorefrontFooter /> : null}
      </div>
    </div>
  );
}