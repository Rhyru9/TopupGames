import type { Metadata } from "next";
import { PromoPageClient } from "@/components/promo/promo-page-client";
import { getActiveFlashSaleBundle } from "@/lib/promo/get-active-flash-sales";
import { getPublicPromoVouchers } from "@/lib/promo/get-public-promo-vouchers";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = {
  title: "Kode Promo — R9host",
  description: "Daftar kode voucher promo global yang sedang aktif di R9host.",
};

export default async function PromoPage() {
  const [vouchers, flashSale, session] = await Promise.all([
    getPublicPromoVouchers(),
    getActiveFlashSaleBundle(),
    getMemberSession(),
  ]);

  return (
    <PromoPageClient
      vouchers={vouchers}
      flashSaleActive={Boolean(flashSale && flashSale.deals.length > 0)}
      memberName={session?.user?.name ?? null}
      memberImage={session?.user?.image ?? null}
    />
  );
}
