"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/landing/header";
import { StorefrontPageShell } from "@/components/landing/storefront-page-shell";
import { formatRupiah } from "@/lib/format-rupiah";
import type { PublicPromoVoucher } from "@/lib/promo/get-public-promo-vouchers";

type PromoPageClientProps = {
  vouchers: PublicPromoVoucher[];
  flashSaleActive: boolean;
  memberName?: string | null;
  memberImage?: string | null;
};

const steps = [
  { n: "1", t: "Salin kode yang kamu mau" },
  { n: "2", t: "Pilih game dan lanjut bayar" },
  { n: "3", t: "Tempel kode di halaman pembayaran" },
];

function perUserLabel(limit: number): string {
  if (limit === 1) return "1× per email & akun tujuan";
  if (limit > 1) return `Maks. ${limit}× per email & akun tujuan`;
  return "Tidak dibatasi per pengguna";
}

function PromoVoucherCard({ voucher }: { voucher: PublicPromoVoucher }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="promo-voucher-card">
      <div className="promo-voucher-card__glow" aria-hidden />
      <div className="promo-voucher-card__head">
        <span className="promo-voucher-card__badge">Potongan {voucher.discountLabel}</span>
      </div>
      {voucher.label ? <p className="promo-voucher-card__label">{voucher.label}</p> : null}
      <div className="promo-voucher-card__code-row">
        <div className="promo-voucher-card__code">{voucher.code}</div>
        <button
          type="button"
          className={`promo-voucher-card__copy${copied ? " is-copied" : ""}`}
          onClick={() => void copyCode()}
        >
          {copied ? "Disalin" : "Salin"}
        </button>
      </div>
      <dl className="promo-voucher-card__meta">
        <div className="promo-voucher-card__meta-row">
          <dt>Minimal transaksi</dt>
          <dd>{formatRupiah(voucher.minOrderAmount)}</dd>
        </div>
        <div className="promo-voucher-card__meta-row">
          <dt>Batas pemakaian</dt>
          <dd>{perUserLabel(voucher.perUserLimit)}</dd>
        </div>
        <div className="promo-voucher-card__meta-row">
          <dt>Periode</dt>
          <dd>{voucher.scheduleLabel}</dd>
        </div>
      </dl>
    </article>
  );
}

export function PromoPageClient({
  vouchers,
  flashSaleActive,
  memberName = null,
  memberImage = null,
}: PromoPageClientProps) {
  return (
    <StorefrontPageShell>
      <div className="storefront-page promo-page">
        <Header
          homeHref="/"
          navPrefix="/"
          forceSolid
          hideSearch={false}
          memberName={memberName}
          memberImage={memberImage}
        />

        <div className="storefront-page__inner promo-page__inner">
          <p className="storefront-page__eyebrow">Promo</p>
          <h1 className="storefront-page__title">
            Hemat di checkout
            <span className="storefront-page__title-accent">pakai kode di bawah</span>
          </h1>
          <p className="storefront-page__lead">
            Salin kode, belanja seperti biasa, lalu tempel saat bayar. Diskon mengikuti syarat minimal
            dan periode masing-masing kode. Flash sale tetap bisa digabung.
          </p>

          <div className="promo-page__steps">
            {steps.map((step) => (
              <div key={step.n} className="promo-page__step">
                <div className="promo-page__step-n">{step.n}</div>
                <p className="promo-page__step-t">{step.t}</p>
              </div>
            ))}
          </div>

          {vouchers.length > 0 ? (
            <div className="promo-page__grid">
              {vouchers.map((voucher) => (
                <PromoVoucherCard key={voucher.code} voucher={voucher} />
              ))}
            </div>
          ) : (
            <div className="storefront-page__empty">
              <h2 className="storefront-page__empty-title">Belum ada kode promo aktif</h2>
              <p className="storefront-page__empty-text">
                Cek lagi nanti — promo global baru akan muncul di halaman ini begitu admin
                mengaktifkannya.
              </p>
              <Link href="/produk" className="storefront-page__cta">
                Lihat katalog game
              </Link>
            </div>
          )}

          {flashSaleActive ? (
            <div className="promo-page__flash">
              <div>
                <p className="promo-page__flash-title">Flash sale sedang berlangsung</p>
                <p className="promo-page__flash-text">
                  Harga spesial berlaku sebelum kode promo — kombinasi keduanya bisa dipakai.
                </p>
              </div>
              <Link href="/flash-sale" className="promo-page__flash-link">
                Lihat flash sale
              </Link>
            </div>
          ) : null}

          {vouchers.length > 0 ? (
            <div className="storefront-page__footer-cta">
              <Link href="/produk" className="storefront-page__cta">
                Mulai order sekarang
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </StorefrontPageShell>
  );
}
