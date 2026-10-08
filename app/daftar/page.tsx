import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { MemberRegisterForm } from "@/components/member/member-register-form";
import { getMemberSession } from "@/lib/member-auth";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { isGoogleLoginConfigured } from "@/lib/site-settings/site-settings-schemas";

export const metadata: Metadata = {
  title: "Daftar — R9host",
};

type DaftarPageProps = {
  searchParams: Promise<{ next?: string }>;
};

function safeNext(raw?: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/member";
  return raw;
}

export default async function DaftarPage({ searchParams }: DaftarPageProps) {
  const { next: nextParam } = await searchParams;
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
            <h1 className="member-auth__title">Daftar</h1>
            <p className="member-auth__lead">
              {googleEnabled
                ? "Daftar pakai Google, atau isi nama, email, dan password."
                : "Buat akun dengan email untuk harga member dan riwayat pesanan."}
            </p>
            <MemberRegisterForm nextPath={nextPath} googleEnabled={googleEnabled} />
          </div>
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
