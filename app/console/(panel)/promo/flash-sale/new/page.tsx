import { redirect } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { FlashSaleForm } from "@/components/console/promo/flash-sale-form";
import { withToastUrl } from "@/lib/console-toast";
import { getFlashSaleSkuOptions, getRunningFlashSale } from "@/lib/promo/flash-sale-data";
import { flashSaleCreateBlockedToast } from "@/lib/promo/flash-sale-toasts";

export default async function NewFlashSalePage() {
  const running = await getRunningFlashSale();
  if (running) {
    redirect(
      withToastUrl(
        "/console/promo/flash-sale",
        flashSaleCreateBlockedToast(running.name),
        "error",
      ),
    );
  }

  const skuOptions = await getFlashSaleSkuOptions();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Promo"
        title="Tambah Flash Sale"
        description="Buat campaign dan pilih SKU yang ikut harga flash."
        backLink={{ href: "/console/promo/flash-sale", label: "← Kembali ke Flash Sale" }}
      />

      <FlashSaleForm mode="create" skuOptions={skuOptions} />
    </div>
  );
}
