import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberLoginGateProvider } from "@/components/member/member-login-gate";
import { ProductPaymentClient } from "@/components/product/product-payment-client";
import { getProductOrderPage } from "@/lib/catalog-products/get-product-order-page";
import { getOrCreateMemberBalance } from "@/lib/member/member-balance";
import { getMemberSession } from "@/lib/member-auth";

type PaymentPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PaymentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductOrderPage(slug);
  if (!product) return { title: "Pembayaran" };
  return {
    title: `Pembayaran — ${product.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function ProductPaymentPage({ params }: PaymentPageProps) {
  const { slug } = await params;
  const memberSession = await getMemberSession();
  const isMember = Boolean(memberSession?.user?.id);
  const product = await getProductOrderPage(slug, { isMember });
  if (!product) notFound();

  const memberWallet = memberSession?.user?.id
    ? await getOrCreateMemberBalance(memberSession.user.id).then((b) => ({
        saldo: b.saldo,
        poin: b.poin,
      }))
    : null;

  return (
    <MemberLoginGateProvider isMember={isMember}>
      <ProductPaymentClient
        product={product}
        memberName={memberSession?.user?.name ?? null}
        memberImage={memberSession?.user?.image ?? null}
        isMember={isMember}
        memberWallet={memberWallet}
      />
    </MemberLoginGateProvider>
  );
}
