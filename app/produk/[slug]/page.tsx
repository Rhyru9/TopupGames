import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberLoginGateProvider } from "@/components/member/member-login-gate";
import { ProductOrderClient } from "@/components/product/product-order-client";
import { getProductOrderPage } from "@/lib/catalog-products/get-product-order-page";
import { getActiveStorefrontPopup } from "@/lib/content/get-active-storefront-popup";
import { getMemberSession } from "@/lib/member-auth";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductOrderPage(slug);
  if (!product) {
    return { title: "Produk tidak ditemukan" };
  }
  return {
    title: `${product.name} — Top Up`,
    description: product.subtitle || `Top up ${product.name} instan di R9host.`,
    openGraph: {
      title: product.name,
      description: product.subtitle || undefined,
      images: product.thumbnailUrl ? [{ url: product.thumbnailUrl }] : undefined,
    },
  };
}

export default async function ProductOrderPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const memberSession = await getMemberSession();
  const isMember = Boolean(memberSession);
  const [product, popup] = await Promise.all([
    getProductOrderPage(slug, { isMember }),
    getActiveStorefrontPopup(),
  ]);
  if (!product) notFound();

  return (
    <MemberLoginGateProvider isMember={isMember}>
      <ProductOrderClient
        product={product}
        memberName={memberSession?.user?.name ?? null}
        memberImage={memberSession?.user?.image ?? null}
        isMember={isMember}
        popup={popup}
      />
    </MemberLoginGateProvider>
  );
}
