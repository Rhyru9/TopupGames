"use client";

import Link from "next/link";
import { logoutMember } from "@/app/member/actions";
import { MemberVerifyEmailButton } from "@/components/member/member-verify-email-button";

type MemberAccountPanelProps = {
  name: string;
  email: string;
  image: string | null;
  whatsapp: string | null;
  saved?: boolean;
  helpHref?: string | null;
  saldoLabel: string;
  poinLabel: string;
  memberSince: string;
  accountStatus: string;
  emailVerified: boolean;
  mailConfigured?: boolean;
};

function Chevron() {
  return (
    <svg className="r9host-profile__chevron" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M9 6.5 14.5 12 9 17.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MemberAccountPanel({
  name,
  email,
  image,
  whatsapp,
  saved,
  helpHref,
  saldoLabel,
  poinLabel,
  memberSince,
  accountStatus,
  emailVerified,
  mailConfigured = false,
}: MemberAccountPanelProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "M";

  return (
    <div className="r9host-profile">
      <div className="r9host-profile__toolbar">
        <h1 className="r9host-profile__page-title">Profil Saya</h1>
        <form action={logoutMember}>
          <button type="submit" className="r9host-profile__logout">
            <svg viewBox="0 0 24 24" aria-hidden fill="none">
              <path
                d="M10 7.2V5.8A1.8 1.8 0 0 1 11.8 4h6.4A1.8 1.8 0 0 1 20 5.8v12.4a1.8 1.8 0 0 1-1.8 1.8h-6.4A1.8 1.8 0 0 1 10 18.2v-1.4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <path
                d="M14.5 12H4.2m0 0 2.6-2.6M4.2 12l2.6 2.6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Keluar
          </button>
        </form>
      </div>

      {saved ? <p className="member-auth__success">Profil berhasil diperbarui.</p> : null}

      {!emailVerified ? (
        <div className="r9host-profile__verify-banner" role="status">
          <div className="r9host-profile__verify-copy">
            <p className="r9host-profile__verify-title">Email belum terverifikasi</p>
            <p className="r9host-profile__verify-text">
              Verifikasi <strong>{email}</strong> untuk mengamankan akun.
            </p>
          </div>
          <MemberVerifyEmailButton mailConfigured={mailConfigured} />
        </div>
      ) : null}

      <section className="r9host-profile__hero">
        <div className="r9host-profile__identity">
          <div className="r9host-profile__avatar-wrap">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="r9host-profile__avatar" />
            ) : (
              <span className="r9host-profile__avatar r9host-profile__avatar--fallback" aria-hidden>
                {initial}
              </span>
            )}
            {emailVerified ? (
              <span className="r9host-profile__verified" aria-label="Email terverifikasi">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="m7.5 12.2 2.8 2.8 6.2-6.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : null}
          </div>

          <div className="r9host-profile__who">
            <p className="r9host-profile__name">{name}</p>
            <p className="r9host-profile__line">
              <span className="r9host-profile__line-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.5 7.5h15v9.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4.5 17V7.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path d="m4.8 8 7.2 5.2L19.2 8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
              {email}
            </p>
            <p className="r9host-profile__line">
              <span className="r9host-profile__line-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7.2 5.5h2.4l1.2 3-1.6 1.1a9 9 0 0 0 4.2 4.2l1.1-1.6 3 1.2v2.4A1.5 1.5 0 0 1 16 17.3 12.2 12.2 0 0 1 6.7 8a1.5 1.5 0 0 1 0.5-2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {whatsapp || "WhatsApp belum diisi"}
            </p>
          </div>
        </div>

        <Link
          href="/member/profil"
          className="r9host-profile__edit"
          aria-label="Edit profil"
          title="Edit profil"
        >
          <svg viewBox="0 0 24 24" aria-hidden fill="none">
            <path
              d="M14.2 5.6 18.4 9.8 8.8 19.4H4.6v-4.2L14.2 5.6Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="m12.8 7 4.2 4.2" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          <span className="r9host-profile__edit-label">Edit Profil</span>
        </Link>
      </section>

      <section className="r9host-profile__wallet" aria-label="Saldo dan poin">
        <Link href="/member/saldo" className="r9host-profile__wallet-card r9host-profile__wallet-card--saldo">
          <span className="r9host-profile__wallet-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4.5 8.2h15v9.3A1.5 1.5 0 0 1 18 19H6a1.5 1.5 0 0 1-1.5-1.5V8.2Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path d="M4.5 8.2 6.4 5.5h11.2L19.5 8.2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <circle cx="15.5" cy="13.2" r="1.2" fill="currentColor" />
            </svg>
          </span>
          <span className="r9host-profile__wallet-label">Saldo</span>
          <span className="r9host-profile__wallet-value">{saldoLabel}</span>
          <span className="r9host-profile__wallet-link">Lihat mutasi &amp; topup</span>
        </Link>

        <div className="r9host-profile__wallet-card r9host-profile__wallet-card--poin">
          <span className="r9host-profile__wallet-icon r9host-profile__wallet-icon--poin" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="m12 4.5 2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 15.3 7.8 17.5l.8-4.7-3.4-3.3 4.7-.7L12 4.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="r9host-profile__wallet-label">Poin</span>
          <span className="r9host-profile__wallet-value">{poinLabel}</span>
          <span className="r9host-profile__wallet-link">Tukar poin segera hadir</span>
        </div>
      </section>

      <section className="r9host-profile__info" aria-label="Informasi akun">
        <div className="r9host-profile__info-row">
          <span className="r9host-profile__info-label">Member sejak</span>
          <span className="r9host-profile__info-value">{memberSince}</span>
        </div>
        <div className="r9host-profile__info-row">
          <span className="r9host-profile__info-label">Status akun</span>
          <span className="r9host-profile__info-pill r9host-profile__info-pill--ok">{accountStatus}</span>
        </div>
        <div className="r9host-profile__info-row">
          <span className="r9host-profile__info-label">Status email</span>
          <span
            className={`r9host-profile__info-pill ${
              emailVerified ? "r9host-profile__info-pill--ok" : "r9host-profile__info-pill--warn"
            }`}
          >
            {emailVerified ? "Terverifikasi" : "Belum verifikasi"}
          </span>
        </div>
      </section>

      <section className="r9host-profile__quick" aria-labelledby="r9host-quick-heading">
        <div className="r9host-profile__quick-head">
          <h2 id="r9host-quick-heading" className="r9host-profile__quick-title">
            Menu Akun
          </h2>
          <p className="r9host-profile__quick-lead">Kelola profil, keamanan, dan transaksi kamu.</p>
        </div>
        <div className="r9host-profile__quick-list">
          <Link href="/member/profil" className="r9host-profile__quick-item">
            <span className="r9host-profile__quick-icon r9host-profile__quick-icon--dash" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M14.2 5.6 18.4 9.8 8.8 19.4H4.6v-4.2L14.2 5.6Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="m12.8 7 4.2 4.2" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <span className="r9host-profile__quick-copy">
              <span className="r9host-profile__quick-label">Edit Profil</span>
              <span className="r9host-profile__quick-hint">Nama, WhatsApp, dan foto profil</span>
            </span>
            <Chevron />
          </Link>

          <Link href="/member/pengaturan" className="r9host-profile__quick-item">
            <span className="r9host-profile__quick-icon r9host-profile__quick-icon--orders" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M12 4.5v1.6M12 17.9v1.6M4.5 12h1.6M17.9 12h1.6M6.7 6.7l1.1 1.1M16.2 16.2l1.1 1.1M17.3 6.7l-1.1 1.1M7.8 16.2l-1.1 1.1"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="r9host-profile__quick-copy">
              <span className="r9host-profile__quick-label">Pengaturan</span>
              <span className="r9host-profile__quick-hint">Password dan keamanan akun</span>
            </span>
            <Chevron />
          </Link>

          <Link href="/member/saldo" className="r9host-profile__quick-item">
            <span className="r9host-profile__quick-icon r9host-profile__quick-icon--dash" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M4.5 8.2h15v9.3A1.5 1.5 0 0 1 18 19H6a1.5 1.5 0 0 1-1.5-1.5V8.2Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M4.5 8.2 6.4 5.5h11.2L19.5 8.2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <circle cx="15.5" cy="13.2" r="1.15" fill="currentColor" />
              </svg>
            </span>
            <span className="r9host-profile__quick-copy">
              <span className="r9host-profile__quick-label">Saldo</span>
              <span className="r9host-profile__quick-hint">Mutasi dan topup saldo</span>
            </span>
            <Chevron />
          </Link>

          <Link href="/member/riwayat" className="r9host-profile__quick-item">
            <span className="r9host-profile__quick-icon r9host-profile__quick-icon--cek" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M7.2 4.8h6.8L17.2 8v11.2H7.2A1.4 1.4 0 0 1 5.8 17.8V6.2A1.4 1.4 0 0 1 7.2 4.8Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M8.4 11.6h7M8.4 14.8h4.6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="r9host-profile__quick-copy">
              <span className="r9host-profile__quick-label">Riwayat</span>
              <span className="r9host-profile__quick-hint">Invoice dan status pesanan</span>
            </span>
            <Chevron />
          </Link>

          {helpHref ? (
            <a
              href={helpHref}
              className="r9host-profile__quick-item"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="r9host-profile__quick-icon r9host-profile__quick-icon--help" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5.2 11.2a6.8 6.8 0 1 1 3.4 5.9L5.2 19l1.3-3.4A6.7 6.7 0 0 1 5.2 11.2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="r9host-profile__quick-copy">
                <span className="r9host-profile__quick-label">Bantuan</span>
                <span className="r9host-profile__quick-hint">Chat CS via WhatsApp</span>
              </span>
              <Chevron />
            </a>
          ) : (
            <Link href="/bantuan" className="r9host-profile__quick-item">
              <span className="r9host-profile__quick-icon r9host-profile__quick-icon--help" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5.2 11.2a6.8 6.8 0 1 1 3.4 5.9L5.2 19l1.3-3.4A6.7 6.7 0 0 1 5.2 11.2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="r9host-profile__quick-copy">
                <span className="r9host-profile__quick-label">Bantuan</span>
                <span className="r9host-profile__quick-hint">Panduan order &amp; FAQ</span>
              </span>
              <Chevron />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
