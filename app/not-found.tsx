import Link from "next/link";
import { StorefrontPageShell } from "@/components/landing/storefront-page-shell";

export default function NotFound() {
  return (
    <StorefrontPageShell>
      <div className="storefront-page">
        <div className="storefront-page__inner">
          <p className="storefront-page__eyebrow">404</p>
          <h1 className="storefront-page__title">
            Halaman
            <span className="storefront-page__title-accent">tidak ditemukan</span>
          </h1>
          <p className="storefront-page__lead">
            URL yang kamu buka tidak ada, sudah dipindahkan, atau salah ketik.
          </p>
          <div className="storefront-page__empty">
            <h2 className="storefront-page__empty-title">Kembali ke beranda</h2>
            <p className="storefront-page__empty-text">
              Lanjut top up game favoritmu dari katalog R9host.
            </p>
            <Link href="/" className="storefront-page__cta">
              Ke beranda
            </Link>
          </div>
        </div>
      </div>
    </StorefrontPageShell>
  );
}
