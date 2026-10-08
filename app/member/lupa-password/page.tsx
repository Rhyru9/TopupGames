import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import {
  MemberForgotPasswordFooter,
  MemberForgotPasswordForm,
} from "@/components/member/member-forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Password — R9host",
};

export default function LupaPasswordPage() {
  return (
    <StorefrontSiteFrame footer="compact" className="member-auth">
      <Header homeHref="/" navPrefix="/" forceSolid hideSearch />
      <main className="member-auth__main">
        <div className="member-auth__card">
          <div className="member-auth__card-inner">
            <p className="member-auth__eyebrow">Member</p>
            <h1 className="member-auth__title">Lupa password</h1>
            <p className="member-auth__lead">
              Masukkan email terdaftar. Jika ada, kami kirim link reset password.
            </p>
            <MemberForgotPasswordForm />
            <MemberForgotPasswordFooter />
          </div>
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
