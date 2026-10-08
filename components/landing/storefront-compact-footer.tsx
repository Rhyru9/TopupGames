"use client";

import Link from "next/link";
import { useSiteBranding } from "@/components/site/site-branding-provider";
import { BrandLogo } from "@/components/site/brand-logo";

/** Footer ringkas — checkout, invoice, detail produk. */
export function StorefrontCompactFooter() {
  const { siteName } = useSiteBranding();

  return (
    <footer className="storefront-compact-footer" aria-label="Footer ringkas">
      <div className="storefront-compact-footer__neon" aria-hidden />
      <div className="storefront-compact-footer__inner">
        <Link href="/" className="storefront-compact-footer__brand">
          <BrandLogo variant="footer" className="storefront-compact-footer__logo" />
        </Link>
        <p className="storefront-compact-footer__note">{siteName} · Harga jelas, pesanan mudah dilacak.</p>
        <nav className="storefront-compact-footer__links" aria-label="Bantuan transaksi">
          <Link href="/cek-transaksi">Cek transaksi</Link>
          <Link href="/bantuan">Bantuan</Link>
        </nav>
      </div>
    </footer>
  );
}
