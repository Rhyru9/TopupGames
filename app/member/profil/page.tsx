import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { MemberProfileForm } from "@/components/member/member-profile-form";
import { getMemberSession } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit Profil — R9host",
};

export default async function MemberProfilPage() {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    redirect("/masuk?next=/member/profil");
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      whatsapp: true,
    },
  });

  if (!member) {
    redirect("/masuk?next=/member/profil");
  }

  return (
    <StorefrontSiteFrame footer="compact" className="member-auth member-area member-area--docked member-area--profile">
      <Header
        homeHref="/"
        navPrefix="/"
        forceSolid
        memberName={member.name}
        memberImage={member.image}
      />
      <main className="member-area__main member-area__main--wide">
        <div className="member-area__shell">
          <div className="r9host-account-page">
            <div className="r9host-account-page__toolbar">
              <div>
                <p className="r9host-account-page__eyebrow">Menu akun</p>
                <h1 className="r9host-account-page__title">Edit profil</h1>
              </div>
              <Link href="/member" className="r9host-account-page__back">
                ← Kembali
              </Link>
            </div>
            <p className="r9host-account-page__lead">
              Perbarui nama, WhatsApp, dan foto profil kamu.
            </p>
            <div className="r9host-account-page__card">
              <MemberProfileForm
                name={member.name}
                email={member.email}
                image={member.image}
                whatsapp={member.whatsapp}
              />
            </div>
          </div>
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
