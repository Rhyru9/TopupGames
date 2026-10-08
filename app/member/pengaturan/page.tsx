import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { MemberSettingsForms } from "@/components/member/member-settings-forms";
import { getMemberSession } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Pengaturan Akun — R9host",
};

type MemberPengaturanPageProps = {
  searchParams: Promise<{ password?: string }>;
};

export default async function MemberPengaturanPage({
  searchParams,
}: MemberPengaturanPageProps) {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    redirect("/masuk?next=/member/pengaturan");
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      image: true,
      passwordHash: true,
    },
  });

  if (!member) {
    redirect("/masuk?next=/member/pengaturan");
  }

  const sp = await searchParams;

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
                <h1 className="r9host-account-page__title">Pengaturan</h1>
              </div>
              <Link href="/member" className="r9host-account-page__back">
                ← Kembali
              </Link>
            </div>
            <p className="r9host-account-page__lead">
              Kelola password dan status keamanan akun.
            </p>
            <MemberSettingsForms
              hasPassword={Boolean(member.passwordHash)}
              passwordSaved={sp.password === "1"}
            />
          </div>
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
