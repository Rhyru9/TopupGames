import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HelpPageClient } from "@/components/support/help-page-client";
import { getMemberSession } from "@/lib/member-auth";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { defaultSiteGeneral } from "@/lib/site-settings/site-settings-schemas";

export const metadata: Metadata = {
  title: "Bantuan — R9host",
  description: "Hubungi tim support R9host untuk bantuan order, pembayaran, dan produk.",
};

export default async function BantuanPage() {
  const [settings, session] = await Promise.all([getSiteSettings(), getMemberSession()]);
  const general = settings.general;
  const enabled = Boolean(general.supportWhatsappEnabled && general.supportWhatsappNumber.trim());

  if (!enabled) {
    redirect("/");
  }

  return (
    <HelpPageClient
      enabled={enabled}
      whatsappNumber={general.supportWhatsappNumber}
      defaultMessage={general.supportWhatsappMessage || defaultSiteGeneral.supportWhatsappMessage}
      memberName={session?.user?.name ?? null}
      memberImage={session?.user?.image ?? null}
    />
  );
}
