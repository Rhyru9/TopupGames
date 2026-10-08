"use client";

import { useActionState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/site/brand-logo";
import { unlockInvoice } from "@/app/actions/checkout";

export function InvoiceAccessForm({ orderCode }: { orderCode: string }) {
  const [state, action, pending] = useActionState(unlockInvoice, {});
  return (
    <form action={action} className="invoice-access" aria-busy={pending}>
      <BrandLogo className="invoice-access__logo" priority />
      <p className="invoice-access__eyebrow">Detail transaksi</p>
      <h1 className="invoice-access__title">Buka invoice kamu</h1>
      <p id="invoice-email-help" className="invoice-access__lead">Gunakan email saat checkout untuk melihat detail pesanan dan pembayaranmu.</p>
      <input type="hidden" name="orderCode" value={orderCode} />
      <label htmlFor="invoice-email" className="invoice-access__label">Email checkout</label>
      <input id="invoice-email" name="email" type="email" autoComplete="email" placeholder="nama@email.com" aria-describedby={state.error ? "invoice-email-help invoice-access-error" : "invoice-email-help"} required className="invoice-access__input" />
      {state.error ? <p id="invoice-access-error" className="invoice-access__error" role="alert">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="invoice-access__submit">
        {pending ? "Memeriksa…" : "Buka invoice"}
      </button>
      <Link href="/cek-transaksi" className="invoice-access__back">Kembali ke cek transaksi</Link>
    </form>
  );
}
