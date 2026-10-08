"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format-rupiah";
import type { PublicInvoiceDto } from "@/lib/orders/order-helpers";
import { sanitizePaymentStepHtml } from "@/lib/payments/payment-instructions";

type InvoiceViewProps = {
  invoice: PublicInvoiceDto;
  autoRefresh?: boolean;
};

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useCountdown(expiresAtIso: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAtIso) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAtIso]);

  return useMemo(() => {
    if (!expiresAtIso) return null;
    const end = new Date(expiresAtIso).getTime();
    if (!Number.isFinite(end)) return null;
    const diff = Math.max(0, end - now);
    const totalSec = Math.floor(diff / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return {
      expired: diff <= 0,
      label: `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`,
    };
  }, [expiresAtIso, now]);
}

function methodLabel(invoice: PublicInvoiceDto): string {
  const pay = invoice.payment;
  if (pay?.channelName || pay?.channel) return pay.channelName || pay.channel;
  if (invoice.voucherDiscountSnapshot > 0 && invoice.amount === 0 && invoice.saldoUsed === 0 && invoice.poinUsed === 0) {
    return "Voucher (gratis)";
  }
  if (invoice.saldoUsed > 0) return "Saldo";
  if (invoice.poinUsed > 0 && invoice.amount === 0) return "Poin";
  return "—";
}

function fulfillmentCopy(invoice: PublicInvoiceDto): { title: string; text: string } {
  switch (invoice.fulfillmentStatus) {
    case "SUCCESS":
      return {
        title: "Pesanan berhasil",
        text: `${invoice.skuName} untuk ${invoice.productName} sudah dikirim.`,
      };
    case "FAILED":
      return {
        title: "Pesanan gagal diproses",
        text: "Pembayaran telah diterima, namun pengisian belum berhasil. Tim kami akan menindaklanjuti, atau saldo dikembalikan agar Anda bisa pesan ulang / ganti produk.",
      };
    case "CANCELLED":
      return {
        title: "Pesanan dibatalkan",
        text: "Saldo sudah dikembalikan ke akun member. Silakan pesan ulang produk yang sama atau pilih produk lain.",
      };
    case "PROCESSING":
      return {
        title: "Sedang diproses",
        text: "Pesanan sedang dikirim ke provider. Status akan berubah otomatis.",
      };
    case "QUEUED":
      return {
        title: "Masuk antrean",
        text: "Pembayaran diterima. Pesanan menunggu giliran diproses.",
      };
    default:
      return {
        title: "Belum diproses",
        text:
          invoice.paymentStatus === "PAID"
            ? "Pembayaran lunas. Pesanan segera masuk antrean."
            : "Pesanan akan diproses setelah pembayaran lunas.",
      };
  }
}

export function InvoiceView({ invoice, autoRefresh = false }: InvoiceViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSn, setCopiedSn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [tick, setTick] = useState(0);
  const [openGuide, setOpenGuide] = useState(0);

  const pay = invoice.payment;
  const expiresAt = pay?.expiredAt ?? invoice.expiresAt;
  const countdown = useCountdown(
    invoice.paymentStatus === "UNPAID" ? expiresAt : null,
  );
  const instructions = pay?.instructions ?? [];
  const orderCopy = fulfillmentCopy(invoice);

  const targetLabel = invoice.playerLabel
    ? [invoice.playerLabel, invoice.playerNickname ? `· ${invoice.playerNickname}` : null]
        .filter(Boolean)
        .join(" ")
    : invoice.playerNickname || null;

  const isProcessing =
    invoice.paymentStatus === "PAID" &&
    (invoice.fulfillmentStatus === "NONE" ||
      invoice.fulfillmentStatus === "QUEUED" ||
      invoice.fulfillmentStatus === "PROCESSING");

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      setChecking(true);
      setTick((n) => n + 1);
      router.refresh();
      window.setTimeout(() => setChecking(false), 900);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, router]);

  useEffect(() => {
    if (instructions.length > 0) setOpenGuide(0);
  }, [instructions.length, invoice.orderCode]);

  async function copyText(value: string, kind: "pay" | "code" | "sn") {
    try {
      await navigator.clipboard.writeText(value);
      if (kind === "pay") {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } else if (kind === "sn") {
        setCopiedSn(true);
        window.setTimeout(() => setCopiedSn(false), 2000);
      } else {
        setCopiedCode(true);
        window.setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      // ignore
    }
  }

  const isOrderFailed = invoice.fulfillmentStatus === "FAILED";
  const statusClass = isOrderFailed
    ? "r9host-deposit__status r9host-deposit__status--failed"
    : `r9host-deposit__status r9host-deposit__status--${invoice.paymentStatus.toLowerCase()}`;

  return (
    <article
      className={[
        "r9host-deposit",
        `r9host-deposit--${invoice.paymentStatus.toLowerCase()}`,
        isOrderFailed ? "r9host-deposit--order-failed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="r9host-deposit__glow" aria-hidden />

      <header className="r9host-deposit__head">
        <div className="r9host-deposit__head-top">
          <p className="r9host-deposit__eyebrow">Invoice produk</p>
          {autoRefresh ? (
            <span className={`r9host-deposit__live ${checking ? "r9host-deposit__live--pulse" : ""}`}>
              <span className="r9host-deposit__live-dot" aria-hidden />
              {checking ? "Cek status…" : "Auto-refresh"}
            </span>
          ) : null}
        </div>

        <div className="r9host-deposit__title-row">
          <h1 className="r9host-deposit__code">{invoice.orderCode}</h1>
          <button
            type="button"
            className="r9host-deposit__icon-btn"
            onClick={() => void copyText(invoice.orderCode, "code")}
            aria-label="Salin kode invoice"
          >
            {copiedCode ? "✓" : "Salin"}
          </button>
        </div>

        <p className={statusClass}>
          {invoice.paymentStatus === "UNPAID" || isProcessing ? (
            <span className="r9host-deposit__status-pulse" aria-hidden />
          ) : null}
          {invoice.statusLabel}
        </p>
      </header>

      <section className="r9host-deposit__hero" aria-label="Ringkasan pembayaran">
        <div className="r9host-deposit__hero-main">
          <p className="r9host-deposit__hero-label">Total bayar</p>
          <p className="r9host-deposit__hero-total">{formatRupiah(invoice.amount)}</p>
          {invoice.feeSnapshot > 0 ? (
            <p className="r9host-deposit__hero-sub">
              Termasuk admin {formatRupiah(invoice.feeSnapshot)}
            </p>
          ) : invoice.poinUsed > 0 || invoice.saldoUsed > 0 ? (
            <p className="r9host-deposit__hero-sub">
              {invoice.poinUsed > 0 ? `Poin −${formatRupiah(invoice.poinUsed)}` : null}
              {invoice.poinUsed > 0 && invoice.saldoUsed > 0 ? " · " : null}
              {invoice.saldoUsed > 0 ? `Saldo −${formatRupiah(invoice.saldoUsed)}` : null}
            </p>
          ) : null}
        </div>

        {invoice.paymentStatus === "UNPAID" && countdown ? (
          <div
            className={`r9host-deposit__timer ${countdown.expired ? "r9host-deposit__timer--expired" : ""}`}
          >
            <p className="r9host-deposit__timer-label">
              {countdown.expired ? "Kadaluarsa" : "Sisa waktu"}
            </p>
            <p className="r9host-deposit__timer-value" aria-live="polite">
              {countdown.label}
            </p>
          </div>
        ) : null}

        {invoice.paymentStatus === "PAID" ? (
          <div className="r9host-deposit__timer r9host-deposit__timer--paid">
            <p className="r9host-deposit__timer-label">Status order</p>
            <p className="r9host-deposit__timer-value">{invoice.fulfillmentStatusLabel}</p>
          </div>
        ) : null}
      </section>

      <section className="r9host-invoice__product" aria-label="Detail produk">
        <p className="r9host-invoice__product-label">Produk</p>
        <p className="r9host-invoice__product-name">{invoice.productName}</p>
        <p className="r9host-invoice__product-sku">{invoice.skuName}</p>
        {targetLabel ? (
          <p className="r9host-invoice__product-target">
            <span>ID / Target</span>
            <strong>{targetLabel}</strong>
          </p>
        ) : null}
      </section>

      <dl className="r9host-deposit__chips r9host-invoice__chips">
        {invoice.voucherDiscountSnapshot > 0 ? (
          <>
            <div className="r9host-deposit__chip">
              <dt>Subtotal</dt>
              <dd>{formatRupiah(invoice.itemSubtotalSnapshot)}</dd>
            </div>
            <div className="r9host-deposit__chip">
              <dt>Voucher{invoice.voucherCodeSnapshot ? ` (${invoice.voucherCodeSnapshot})` : ""}</dt>
              <dd>−{formatRupiah(invoice.voucherDiscountSnapshot)}</dd>
            </div>
          </>
        ) : null}
        <div className="r9host-deposit__chip">
          <dt>Harga</dt>
          <dd>{formatRupiah(invoice.priceSnapshot)}</dd>
        </div>
        {invoice.poinUsed > 0 ? (
          <div className="r9host-deposit__chip">
            <dt>Poin</dt>
            <dd>−{formatRupiah(invoice.poinUsed)}</dd>
          </div>
        ) : null}
        {invoice.saldoUsed > 0 ? (
          <div className="r9host-deposit__chip">
            <dt>Saldo</dt>
            <dd>−{formatRupiah(invoice.saldoUsed)}</dd>
          </div>
        ) : null}
        <div className="r9host-deposit__chip">
          <dt>Metode</dt>
          <dd>{methodLabel(invoice)}</dd>
        </div>
        <div className="r9host-deposit__chip">
          <dt>Dibuat</dt>
          <dd>{formatDateTime(invoice.createdAt)}</dd>
        </div>
      </dl>

      <section
        className={`r9host-invoice__panel r9host-invoice__panel--pay r9host-invoice__panel--${invoice.paymentStatus.toLowerCase()}`}
        aria-label="Pembayaran"
      >
        <div className="r9host-invoice__panel-head">
          <h2 className="r9host-invoice__panel-title">Pembayaran</h2>
          <span
            className={`r9host-invoice__panel-badge r9host-invoice__panel-badge--${invoice.paymentStatus.toLowerCase()}`}
          >
            {invoice.paymentStatusLabel}
          </span>
        </div>

        <dl className="r9host-invoice__panel-grid">
          <div>
            <dt>Metode</dt>
            <dd>{methodLabel(invoice)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatRupiah(invoice.amount)}</dd>
          </div>
          {invoice.paidAt ? (
            <div>
              <dt>Lunas pada</dt>
              <dd>{formatDateTime(invoice.paidAt)}</dd>
            </div>
          ) : invoice.paymentStatus === "UNPAID" && expiresAt ? (
            <div>
              <dt>Batas bayar</dt>
              <dd>{formatDateTime(expiresAt)}</dd>
            </div>
          ) : null}
          {invoice.email ? (
            <div>
              <dt>Email</dt>
              <dd>{invoice.email}</dd>
            </div>
          ) : null}
          {invoice.whatsapp ? (
            <div>
              <dt>WhatsApp</dt>
              <dd>{invoice.whatsapp}</dd>
            </div>
          ) : null}
        </dl>

        {invoice.paymentStatus === "PAID" ? (
          <p className="r9host-invoice__panel-note">Pembayaran sudah diterima.</p>
        ) : null}
        {invoice.paymentStatus === "EXPIRED" ? (
          <p className="r9host-invoice__panel-note r9host-invoice__panel-note--warn">
            Waktu pembayaran habis. Buat order baru untuk mencoba lagi.
          </p>
        ) : null}
        {invoice.paymentStatus === "FAILED" ? (
          <p className="r9host-invoice__panel-note r9host-invoice__panel-note--warn">
            Pembayaran gagal diproses gateway. Buat order baru atau ganti metode.
          </p>
        ) : null}
      </section>

      <section
        className={`r9host-invoice__panel r9host-invoice__panel--order r9host-invoice__panel--fulfill-${invoice.fulfillmentStatus.toLowerCase()}`}
        aria-label="Pesanan"
      >
        <div className="r9host-invoice__panel-head">
          <h2 className="r9host-invoice__panel-title">Pesanan</h2>
          <span
            className={`r9host-invoice__panel-badge r9host-invoice__panel-badge--fulfill-${invoice.fulfillmentStatus.toLowerCase()}`}
          >
            {invoice.fulfillmentStatusLabel}
          </span>
        </div>

        <p className="r9host-invoice__panel-lead">{orderCopy.title}</p>
        <p className="r9host-invoice__panel-text">{orderCopy.text}</p>

        <dl className="r9host-invoice__panel-grid">
          {targetLabel ? (
            <div>
              <dt>Target</dt>
              <dd>{targetLabel}</dd>
            </div>
          ) : null}
          {invoice.fulfillmentCompletedAt ? (
            <div>
              <dt>Selesai</dt>
              <dd>{formatDateTime(invoice.fulfillmentCompletedAt)}</dd>
            </div>
          ) : null}
        </dl>

        {invoice.fulfillmentSn ? (
          <div className="r9host-invoice__sn">
            <div>
              <p className="r9host-invoice__sn-label">Serial / SN</p>
              <p className="r9host-invoice__sn-value">{invoice.fulfillmentSn}</p>
            </div>
            <button
              type="button"
              className={`r9host-deposit__btn r9host-deposit__btn--ghost ${copiedSn ? "r9host-deposit__btn--ok" : ""}`}
              onClick={() => void copyText(invoice.fulfillmentSn!, "sn")}
            >
              {copiedSn ? "Tersalin ✓" : "Salin SN"}
            </button>
          </div>
        ) : null}
      </section>

      {invoice.paymentStatus === "UNPAID" && pay ? (
        <section className="r9host-deposit__pay" aria-label="Instruksi pembayaran">
          <div className="r9host-deposit__pay-layout">
            {pay.qrUrl ? (
              <div className="r9host-deposit__qr-card">
                <div className="r9host-deposit__qr-frame">
                  <span className="r9host-deposit__qr-corner r9host-deposit__qr-corner--tl" aria-hidden />
                  <span className="r9host-deposit__qr-corner r9host-deposit__qr-corner--tr" aria-hidden />
                  <span className="r9host-deposit__qr-corner r9host-deposit__qr-corner--bl" aria-hidden />
                  <span className="r9host-deposit__qr-corner r9host-deposit__qr-corner--br" aria-hidden />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pay.qrUrl} alt="QR pembayaran" className="r9host-deposit__qr-img" />
                </div>
                <p className="r9host-deposit__qr-caption">Scan QRIS dari aplikasi e-wallet / bank</p>
              </div>
            ) : null}

            <div className="r9host-deposit__pay-actions">
              {pay.payCode ? (
                <div className="r9host-deposit__va">
                  <p className="r9host-deposit__va-label">Kode bayar / VA</p>
                  <p className="r9host-deposit__va-value">{pay.payCode}</p>
                  <button
                    type="button"
                    className={`r9host-deposit__btn r9host-deposit__btn--ghost ${copied ? "r9host-deposit__btn--ok" : ""}`}
                    onClick={() => void copyText(pay.payCode!, "pay")}
                  >
                    {copied ? "Tersalin ✓" : "Salin kode"}
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                className="r9host-deposit__btn r9host-deposit__btn--primary"
                onClick={() => {
                  setChecking(true);
                  router.refresh();
                  window.setTimeout(() => setChecking(false), 900);
                }}
              >
                {checking ? "Memeriksa…" : "Cek status sekarang"}
              </button>

              <p className="r9host-deposit__hint">
                Setelah bayar, status berubah otomatis. Item diproses tanpa perlu refresh manual.
                {tick > 0 ? ` · dicek ${tick}×` : ""}
              </p>
            </div>
          </div>

          {instructions.length > 0 ? (
            <div className="r9host-deposit__guides" aria-label="Tata cara bayar">
              <div className="r9host-deposit__guides-head">
                <h2 className="r9host-deposit__guides-title">Tata cara bayar</h2>
                <p className="r9host-deposit__guides-lead">
                  Ikuti langkah sesuai metode {pay.channelName || pay.channel}.
                </p>
              </div>

              <div className="r9host-deposit__accordions">
                {instructions.map((group, index) => {
                  const open = openGuide === index;
                  return (
                    <div
                      key={`${group.title}-${index}`}
                      className={`r9host-deposit__accordion ${open ? "r9host-deposit__accordion--open" : ""}`}
                    >
                      <button
                        type="button"
                        className="r9host-deposit__accordion-toggle"
                        aria-expanded={open}
                        onClick={() => setOpenGuide(open ? -1 : index)}
                      >
                        <span className="r9host-deposit__accordion-num">{pad2(index + 1)}</span>
                        <span className="r9host-deposit__accordion-label">{group.title}</span>
                        <span className="r9host-deposit__accordion-chevron" aria-hidden>
                          {open ? "−" : "+"}
                        </span>
                      </button>
                      {open ? (
                        <ol className="r9host-deposit__steps">
                          {group.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="r9host-deposit__step">
                              <span className="r9host-deposit__step-num" aria-hidden>
                                {stepIndex + 1}
                              </span>
                              <span
                                className="r9host-deposit__step-text"
                                dangerouslySetInnerHTML={{
                                  __html: sanitizePaymentStepHtml(step),
                                }}
                              />
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="r9host-deposit__guides r9host-deposit__guides--fallback">
              <h2 className="r9host-deposit__guides-title">Cara bayar cepat</h2>
              <ol className="r9host-deposit__steps">
                <li className="r9host-deposit__step">
                  <span className="r9host-deposit__step-num" aria-hidden>
                    1
                  </span>
                  <span className="r9host-deposit__step-text">
                    Buka aplikasi pembayaran yang mendukung{" "}
                    <b>{pay.channelName || pay.channel}</b>.
                  </span>
                </li>
                <li className="r9host-deposit__step">
                  <span className="r9host-deposit__step-num" aria-hidden>
                    2
                  </span>
                  <span className="r9host-deposit__step-text">
                    {pay.qrUrl
                      ? "Scan QR di atas, lalu konfirmasi di aplikasi pembayaran."
                      : pay.payCode
                        ? "Masukkan kode bayar / VA yang ditampilkan, lalu konfirmasi."
                        : "Selesaikan pembayaran sesuai metode yang dipilih."}
                  </span>
                </li>
                <li className="r9host-deposit__step">
                  <span className="r9host-deposit__step-num" aria-hidden>
                    3
                  </span>
                  <span className="r9host-deposit__step-text">
                    Pastikan nominal tepat <b>{formatRupiah(invoice.amount)}</b>, lalu bayar.
                  </span>
                </li>
              </ol>
            </div>
          )}
        </section>
      ) : null}

      {invoice.paymentStatus === "PAID" ? (
        <section className="r9host-deposit__success" aria-label="Ringkasan hasil">
          <div className="r9host-deposit__success-badge" aria-hidden>
            {invoice.fulfillmentStatus === "SUCCESS" ? "✓" : isProcessing ? "…" : "!"}
          </div>
          <h2 className="r9host-deposit__success-title">{orderCopy.title}</h2>
          <p className="r9host-deposit__success-text">{orderCopy.text}</p>
          {isProcessing ? (
            <button
              type="button"
              className="r9host-deposit__btn r9host-deposit__btn--primary"
              onClick={() => {
                setChecking(true);
                router.refresh();
                window.setTimeout(() => setChecking(false), 900);
              }}
            >
              {checking ? "Memeriksa…" : "Cek status pesanan"}
            </button>
          ) : (
            <div className="r9host-deposit__success-actions">
              {invoice.fulfillmentStatus === "CANCELLED" && invoice.productSlug ? (
                <Link
                  href={`/produk/${invoice.productSlug}`}
                  className="r9host-deposit__btn r9host-deposit__btn--primary"
                >
                  Pesan ulang
                </Link>
              ) : null}
              <Link
                href="/produk"
                className={
                  invoice.fulfillmentStatus === "CANCELLED" && invoice.productSlug
                    ? "r9host-deposit__btn r9host-deposit__btn--ghost"
                    : "r9host-deposit__btn r9host-deposit__btn--primary"
                }
              >
                {invoice.fulfillmentStatus === "CANCELLED" ? "Ganti produk" : "Belanja lagi"}
              </Link>
            </div>
          )}
        </section>
      ) : null}

      {invoice.paymentStatus === "EXPIRED" || invoice.paymentStatus === "FAILED" ? (
        <section className="r9host-deposit__success r9host-deposit__success--fail">
          <h2 className="r9host-deposit__success-title">
            {invoice.paymentStatus === "EXPIRED" ? "Pembayaran kadaluarsa" : "Pembayaran gagal"}
          </h2>
          <p className="r9host-deposit__success-text">
            Buat order baru untuk mencoba lagi dengan metode yang sama atau berbeda.
          </p>
          <Link href="/produk" className="r9host-deposit__btn r9host-deposit__btn--primary">
            Kembali ke katalog
          </Link>
        </section>
      ) : null}
    </article>
  );
}
