import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { verifyMemberEmailToken } from "@/app/member/actions";

export const metadata: Metadata = {
  title: "Verifikasi Email — R9host",
};

type VerifikasiEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifikasiEmailPage({ searchParams }: VerifikasiEmailPageProps) {
  const { token } = await searchParams;
  const raw = token?.trim();

  if (!raw) {
    return (
      <StorefrontSiteFrame footer="compact" className="member-auth">
        <Header homeHref="/" navPrefix="/" forceSolid hideSearch />
        <main className="member-auth__main">
          <div className="member-auth__card">
            <div className="member-auth__card-inner">
              <h1 className="member-auth__title">Verifikasi email</h1>
              <p className="member-auth__lead">Link verifikasi tidak valid.</p>
              <Link href="/member" className="member-auth__submit member-auth__submit--link">
                Kembali ke profil
              </Link>
            </div>
          </div>
        </main>
      </StorefrontSiteFrame>
    );
  }

  const result = await verifyMemberEmailToken(raw);
  if (result.ok) {
    redirect("/member?verified=1");
  }

  return (
    <StorefrontSiteFrame footer="compact" className="member-auth">
      <Header homeHref="/" navPrefix="/" forceSolid hideSearch />
      <main className="member-auth__main">
        <div className="member-auth__card">
          <div className="member-auth__card-inner">
            <h1 className="member-auth__title">Verifikasi gagal</h1>
            <p className="member-auth__error">{result.error}</p>
            <Link href="/member" className="member-auth__submit member-auth__submit--link">
              Kembali ke profil
            </Link>
          </div>
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
