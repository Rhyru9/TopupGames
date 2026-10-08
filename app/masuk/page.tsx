import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { MemberLoginForm } from "@/components/member/member-login-form";
import { getMemberSession } from "@/lib/member-auth";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { isGoogleLoginConfigured } from "@/lib/site-settings/site-settings-schemas";

export const metadata: Metadata = {
  title: "Masuk — R9host",
};

type MasukPageProps = {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
};

function resetMessage(code?: string) {
  if (code === "sent") {
    return "Jika email terdaftar, link reset password sudah dikirim.";
  }
  if (code === "ok") {
    return "Password berhasil diubah. Silakan masuk.";
  }
  return null;
}

function safeNext(raw?: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/member";
  return raw;
}

function googleErrorMessage(code?: string) {
  if (code === "google_unregistered") {
    return "Email Google belum terdaftar. Silakan daftar dulu di halaman Daftar.";
  }
  return null;
}

export default async function MasukPage({ searchParams }: MasukPageProps) {
  const { next: nextParam, error, reset } = await searchParams;
  const nextPath = safeNext(nextParam);
  const session = await getMemberSession();
  if (session) redirect(nextPath);

  const settings = await getSiteSettings();
  const googleEnabled = isGoogleLoginConfigured(settings.auth);

  return (
    <StorefrontSiteFrame className="member-auth">
      <Header homeHref="/" navPrefix="/" forceSolid hideSearch />
      <main className="member-auth__main">
        <div className="member-auth__card">
          <div className="member-auth__card-inner">
            <p className="member-auth__eyebrow">Member</p>
            <h1 className="member-auth__title">Masuk</h1>
            <p className="member-auth__lead">
              {googleEnabled
                ? "Pakai Google kalau emailnya sudah terdaftar, atau masuk dengan email dan password."
                : "Masuk untuk harga member, riwayat, dan lanjut checkout lebih cepat."}
            </p>
            {resetMessage(reset) ? (
              <p className="member-auth__success">{resetMessage(reset)}</p>
            ) : null}
            <MemberLoginForm
              nextPath={nextPath}
              googleEnabled={googleEnabled}
              googleError={googleErrorMessage(error)}
            />
          </div>
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
