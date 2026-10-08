import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { MemberAccountPanel } from "@/components/member/member-account-panel";
import { getMemberSession } from "@/lib/member-auth";
import {
  formatPoin,
  formatRupiah,
  getOrCreateMemberBalance,
} from "@/lib/member/member-balance";
import { MEMBER_STATUS_LABEL } from "@/lib/member/member-status";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  buildWhatsAppChatUrl,
  defaultSiteGeneral,
  isMailConfigured,
} from "@/lib/site-settings/site-settings-schemas";

export const metadata: Metadata = {
  title: "Profil Saya — R9host",
};

type MemberPageProps = {
  searchParams: Promise<{ saved?: string; verified?: string }>;
};

function formatMemberSince(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function MemberPage({ searchParams }: MemberPageProps) {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    redirect("/masuk?next=/member");
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      whatsapp: true,
      isActive: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!member) {
    redirect("/masuk?next=/member");
  }

  const { saved, verified } = await searchParams;
  const balance = await getOrCreateMemberBalance(session.user.id);
  const siteSettings = await getSiteSettings();

  let helpHref: string | null = null;
  const general = siteSettings.general;
  if (general.supportWhatsappEnabled) {
    helpHref = buildWhatsAppChatUrl(
      general.supportWhatsappNumber,
      general.supportWhatsappMessage || defaultSiteGeneral.supportWhatsappMessage,
    );
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
          <MemberAccountPanel
            name={member.name}
            email={member.email}
            image={member.image}
            whatsapp={member.whatsapp}
            saved={saved === "1" || verified === "1"}
            helpHref={helpHref}
            saldoLabel={formatRupiah(balance.saldo)}
            poinLabel={formatPoin(balance.poin)}
            memberSince={formatMemberSince(member.createdAt)}
            accountStatus={MEMBER_STATUS_LABEL[member.status]}
            emailVerified={Boolean(member.emailVerified)}
            mailConfigured={isMailConfigured(siteSettings.mail)}
          />
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
