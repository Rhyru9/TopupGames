"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { lookupOrderByContact } from "@/app/actions/checkout";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { InvoiceView } from "@/components/orders/invoice-view";
import type { PublicInvoiceDto } from "@/lib/orders/order-helpers";

type CekTransaksiClientProps = {
  memberName?: string | null;
  memberImage?: string | null;
};

export function CekTransaksiClient({
  memberName = null,
  memberImage = null,
}: CekTransaksiClientProps) {
  const [orderCode, setOrderCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<PublicInvoiceDto | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(() => {
      void (async () => {
        const result = await lookupOrderByContact({
          orderCode,
          email,
        });
        if (!result.ok) {
          setInvoice(null);
          setError(result.error);
          return;
        }
        setInvoice(result.invoice);
      })();
    });
  }

  return (
    <StorefrontSiteFrame>
      <div className="invoice-page">
      <Header
        homeHref="/"
        navPrefix="/"
        forceSolid
        memberName={memberName}
        memberImage={memberImage}
      />
      <div className="invoice-page__inner invoice-page__inner--cek">
        <p className="storefront-page__eyebrow" style={{ marginBottom: "0.45rem" }}>
          Lacak pesanan
        </p>
        <h1 className="invoice-page__title">Cek transaksi</h1>
        <p className="invoice-page__lead">
          Isi kode invoice dari email konfirmasi, plus email yang kamu pakai saat bayar.
          Status dan tautan pembayaran muncul di sini.
        </p>

        <form className="cek-form" onSubmit={onSubmit}>
          <label className="cek-form__field">
            <span>Kode invoice</span>
            <input
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value.trim())}
              placeholder="Contoh: R9a1b2ch9d8e7f6a5o3c1st"
              spellCheck={false}
              required
              autoComplete="off"
            />
          </label>
          <label className="cek-form__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              required
            />
          </label>
          <button type="submit" className="cek-form__submit" disabled={pending}>
            {pending ? "Mencari…" : "Cari invoice"}
          </button>
          {error ? <p className="cek-form__error">{error}</p> : null}
        </form>

        {invoice ? (
          <div className="invoice-page__result">
            <InvoiceView invoice={invoice} />
            <p className="invoice-page__result-link">
              <Link href={`/invoice/${invoice.orderCode}`}>Buka halaman invoice penuh →</Link>
            </p>
          </div>
        ) : null}
      </div>
      </div>
    </StorefrontSiteFrame>
  );
}
