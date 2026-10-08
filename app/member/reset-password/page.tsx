import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { MemberResetPasswordForm } from "@/components/member/member-reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password — R9host",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const raw = token?.trim();

  return (
    <StorefrontSiteFrame footer="compact" className="member-auth">
      <Header homeHref="/" navPrefix="/" forceSolid hideSearch />
      <main className="member-auth__main">
        <div className="member-auth__card">
          <div className="member-auth__card-inner">
            <p className="member-auth__eyebrow">Member</p>
            <h1 className="member-auth__title">Reset password</h1>
            {!raw ? (
              <>
                <p className="member-auth__error">Link reset tidak valid atau sudah kedaluwarsa.</p>
                <Link href="/member/lupa-password" className="member-auth__submit member-auth__submit--link">
                  Minta link baru
                </Link>
              </>
            ) : (
              <>
                <p className="member-auth__lead">Buat password baru untuk akun Anda.</p>
                <MemberResetPasswordForm token={raw} />
              </>
            )}
          </div>
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
