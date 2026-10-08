"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format-rupiah";
import type { PublicDepositInvoiceDto } from "@/lib/member/member-deposits";
import { sanitizePaymentStepHtml } from "@/lib/payments/payment-instructions";

type DepositPayViewProps = {
  invoice: PublicDepositInvoiceDto;
  autoRefresh?: boolean;
};

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
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
      hours,
      minutes,
      seconds,
    };
  }, [expiresAtIso, now]);
}

export function DepositPayView({ invoice, autoRefresh = false }: DepositPayViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [openGuide, setOpenGuide] = useState(0);
  const [checking, setChecking] = useState(false);
  const [tick, setTick] = useState(0);

  const pay = invoice.payment;
  const expiresAt = pay?.expiredAt ?? invoice.expiresAt;
  const countdown = useCountdown(
    invoice.paymentStatus === "UNPAID" ? expiresAt : null,
  );
  const instructions = pay?.instructions ?? [];

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
  }, [instructions.length, invoice.depositCode]);

  async function copyText(value: string, kind: "pay" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      if (kind === "pay") {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedCode(true);
        window.setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      // ignore
    }
  }

  const statusClass = `r9host-deposit__status r9host-deposit__status--${invoice.paymentStatus.toLowerCase()}`;

  return (
    <article className={`r9host-deposit r9host-deposit--${invoice.paymentStatus.toLowerCase()}`}>
      <div className="r9host-deposit__glow" aria-hidden />

      <header className="r9host-deposit__head">
        <div className="r9host-deposit__head-top">
          <p className="r9host-deposit__eyebrow">Topup saldo</p>
          {invoice.paymentStatus === "UNPAID" ? (
            <span className={`r9host-deposit__live ${checking ? "r9host-deposit__live--pulse" : ""}`}>
              <span className="r9host-deposit__live-dot" aria-hidden />
              {checking ? "Cek status…" : "Auto-refresh"}
            </span>
          ) : null}
        </div>

        <div className="r9host-deposit__title-row">
          <h1 className="r9host-deposit__code">{invoice.depositCode}</h1>
          <button
            type="button"
            className="r9host-deposit__icon-btn"
            onClick={() => void copyText(invoice.depositCode, "code")}
            aria-label="Salin kode deposit"
          >
            {copiedCode ? "✓" : "Salin"}
          </button>
        </div>

        <p className={statusClass}>
          {invoice.paymentStatus === "UNPAID" ? (
            <span className="r9host-deposit__status-pulse" aria-hidden />
          ) : null}
          {invoice.statusLabel}
        </p>
      </header>

      <section className="r9host-deposit__hero" aria-label="Ringkasan pembayaran">
        <div className="r9host-deposit__hero-main">
          <p className="r9host-deposit__hero-label">Total bayar</p>
          <p className="r9host-deposit__hero-total">{formatRupiah(invoice.totalAmount)}</p>
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

        {invoice.paymentStatus === "PAID" && invoice.saldoAfter != null ? (
          <div className="r9host-deposit__timer r9host-deposit__timer--paid">
            <p className="r9host-deposit__timer-label">Saldo sekarang</p>
            <p className="r9host-deposit__timer-value">{formatRupiah(invoice.saldoAfter)}</p>
          </div>
        ) : null}
      </section>

      <dl className="r9host-deposit__chips">
        <div className="r9host-deposit__chip">
          <dt>Metode</dt>
          <dd>{pay?.channelName || pay?.channel || "—"}</dd>
        </div>
        <div className="r9host-deposit__chip">
          <dt>Kredit</dt>
          <dd>{formatRupiah(invoice.amount)}</dd>
        </div>
        <div className="r9host-deposit__chip">
          <dt>Dibuat</dt>
          <dd>
            {new Date(invoice.createdAt).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </dd>
        </div>
      </dl>

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
                Setelah bayar, status berubah otomatis. Saldo masuk tanpa perlu refresh manual.
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
                    Pastikan nominal tepat <b>{formatRupiah(invoice.totalAmount)}</b>, lalu bayar.
                  </span>
                </li>
              </ol>
            </div>
          )}
        </section>
      ) : null}

      {invoice.paymentStatus === "PAID" ? (
        <section className="r9host-deposit__success" aria-label="Pembayaran berhasil">
          <div className="r9host-deposit__success-badge" aria-hidden>
            ✓
          </div>
          <h2 className="r9host-deposit__success-title">Saldo berhasil ditambahkan</h2>
          <p className="r9host-deposit__success-text">
            Kredit {formatRupiah(invoice.amount)} sudah masuk ke akunmu.
          </p>
          <Link href="/member/saldo" className="r9host-deposit__btn r9host-deposit__btn--primary">
            Lihat saldo &amp; mutasi
          </Link>
        </section>
      ) : null}

      {invoice.paymentStatus === "EXPIRED" || invoice.paymentStatus === "FAILED" ? (
        <section className="r9host-deposit__success r9host-deposit__success--fail">
          <h2 className="r9host-deposit__success-title">
            {invoice.paymentStatus === "EXPIRED" ? "Pembayaran kadaluarsa" : "Pembayaran gagal"}
          </h2>
          <p className="r9host-deposit__success-text">
            Buat topup baru untuk mencoba lagi dengan metode yang sama atau berbeda.
          </p>
          <Link href="/member/saldo/topup" className="r9host-deposit__btn r9host-deposit__btn--primary">
            Topup lagi
          </Link>
        </section>
      ) : null}
    </article>
  );
}
