"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Header } from "@/components/landing/header";
import { StorefrontPageShell } from "@/components/landing/storefront-page-shell";
import { buildWhatsAppChatUrl } from "@/lib/site-settings/site-settings-schemas";

type HelpPageClientProps = {
  enabled: boolean;
  whatsappNumber: string;
  defaultMessage: string;
  memberName?: string | null;
  memberImage?: string | null;
};

export function HelpPageClient({
  enabled,
  whatsappNumber,
  defaultMessage,
  memberName = null,
  memberImage = null,
}: HelpPageClientProps) {
  const [message, setMessage] = useState(defaultMessage);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const text = message.trim();
    if (!text) {
      setError("Tulis pesan terlebih dahulu.");
      return;
    }

    const url = buildWhatsAppChatUrl(whatsappNumber, text);
    if (!url) {
      setError("Layanan bantuan sedang tidak tersedia.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <StorefrontPageShell>
      <div className="storefront-page help-page">
        <Header
          homeHref="/"
          navPrefix="/"
          forceSolid
          hideSearch={false}
          memberName={memberName}
          memberImage={memberImage}
        />

        <div className="storefront-page__inner help-page__inner">
          <p className="storefront-page__eyebrow">Layanan bantuan</p>
          <h1 className="storefront-page__title">
            Hubungi
            <span className="storefront-page__title-accent">tim support</span>
          </h1>
          <p className="storefront-page__lead">
            Jelaskan kendala order, pembayaran, atau produk. Tim kami siap membantu dengan respon
            secepat mungkin.
          </p>

          {enabled ? (
            <form className="help-page__form" onSubmit={onSubmit}>
              <label className="help-page__field">
                <span className="help-page__label">Detail pesan</span>
                <textarea
                  className="help-page__textarea"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={6}
                  placeholder="Contoh: Saya ingin menanyakan status invoice R9xxxxxhxxxxxxxxxoxxxst..."
                  maxLength={1000}
                  required
                />
              </label>
              {error ? <p className="help-page__error">{error}</p> : null}
              <div className="help-page__actions">
                <p className="help-page__hint">Maks. 1000 karakter</p>
                <button type="submit" className="help-page__submit">
                  Kirim pesan
                </button>
              </div>
            </form>
          ) : (
            <div className="storefront-page__empty">
              <h2 className="storefront-page__empty-title">Bantuan belum tersedia</h2>
              <p className="storefront-page__empty-text">
                Layanan support sedang nonaktif. Silakan coba lagi nanti.
              </p>
              <Link href="/" className="storefront-page__cta">
                Kembali ke beranda
              </Link>
            </div>
          )}
        </div>
      </div>
    </StorefrontPageShell>
  );
}
