import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { FlashSaleForm } from "@/components/console/promo/flash-sale-form";
import {
  getFlashSaleForEdit,
  getFlashSaleSkuOptions,
} from "@/lib/promo/flash-sale-data";
import { toDatetimeLocalValue } from "@/lib/promo/flash-sale-shared";

type EditFlashSalePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditFlashSalePage({ params }: EditFlashSalePageProps) {
  const { id } = await params;
  const flashSale = await getFlashSaleForEdit(id);
  if (!flashSale) notFound();

  const skuOptions = await getFlashSaleSkuOptions(
    flashSale.items.map((item) => item.productSkuId),
  );

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Promo"
        title={`Edit ${flashSale.name}`}
        description="Ubah jadwal campaign dan daftar SKU flash sale."
        backLink={{ href: "/console/promo/flash-sale", label: "← Kembali ke Flash Sale" }}
      />

      <FlashSaleForm
        mode="edit"
        flashSaleId={flashSale.id}
        skuOptions={skuOptions}
        initialValues={{
          name: flashSale.name,
          headline: flashSale.headline,
          headlineAccent: flashSale.headlineAccent,
          tagline: flashSale.tagline,
          startsAt: toDatetimeLocalValue(flashSale.startsAt),
          endsAt: toDatetimeLocalValue(flashSale.endsAt),
          isEnabled: flashSale.isEnabled,
          sortOrder: flashSale.sortOrder,
          items: flashSale.items.map((item) => ({
            productSkuId: item.productSkuId,
            priceGuest: item.priceGuest,
            priceMember: item.priceMember,
            quota: item.quota,
            soldCount: item.soldCount,
            sortOrder: item.sortOrder,
          })),
        }}
      />
    </div>
  );
}
