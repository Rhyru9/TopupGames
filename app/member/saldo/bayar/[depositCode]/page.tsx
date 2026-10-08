import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { DepositPayView } from "@/components/member/deposit-pay-view";
import { getMemberDepositByCode } from "@/lib/member/member-deposits";
import { getMemberSession } from "@/lib/member-auth";

type PageProps = {
  params: Promise<{ depositCode: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { depositCode } = await params;
  return {
    title: `Bayar ${depositCode} — R9host`,
  };
}

export default async function MemberSaldoBayarPage({ params }: PageProps) {
  const session = await getMemberSession();
  const { depositCode } = await params;

  if (!session?.user?.id) {
    redirect(`/masuk?next=/member/saldo/bayar/${encodeURIComponent(depositCode)}`);
  }

  const invoice = await getMemberDepositByCode({
    depositCode,
    memberId: session.user.id,
  });
  if (!invoice) notFound();

  return (
    <StorefrontSiteFrame footer="compact">
      <main className="invoice-page invoice-page--deposit">
        <div className="invoice-page__inner invoice-page__inner--deposit">
          <div className="invoice-page__top">
            <Link href="/member/saldo" className="invoice-page__back">
              ← Kembali ke saldo
            </Link>
          </div>
          <DepositPayView
            invoice={invoice}
            autoRefresh={invoice.paymentStatus === "UNPAID"}
          />
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
