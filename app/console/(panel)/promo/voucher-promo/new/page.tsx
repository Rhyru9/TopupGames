import { ConsolePageHeader } from "@/components/console/console-page-header";
import { VoucherPromoForm } from "@/components/console/promo/voucher-promo-form";

export default function NewVoucherPromoPage() {
  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Voucher Promo"
        title="Buat voucher"
        description="Kode promo untuk potongan harga di checkout."
        backLink={{ href: "/console/promo/voucher-promo", label: "← Kembali ke daftar" }}
      />
      <div className="console-panel console-panel--padded">
        <VoucherPromoForm mode="create" />
      </div>
    </div>
  );
}
