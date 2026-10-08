import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { VoucherPromoForm } from "@/components/console/promo/voucher-promo-form";
import { getPromoVoucherById } from "@/lib/promo/voucher-data";

type EditVoucherPromoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVoucherPromoPage({ params }: EditVoucherPromoPageProps) {
  const { id } = await params;
  const voucher = await getPromoVoucherById(id);
  if (!voucher) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Voucher Promo"
        title={voucher.code}
        description={voucher.label ?? "Edit kode promo dan aturan pemakaian."}
        backLink={{ href: "/console/promo/voucher-promo", label: "← Kembali ke daftar" }}
      />
      <div className="console-panel console-panel--padded">
        <VoucherPromoForm
          mode="edit"
          voucherId={voucher.id}
          initialValues={{
            code: voucher.code,
            label: voucher.label ?? "",
            type: voucher.type,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            maxDiscount: voucher.maxDiscount,
            minOrderAmount: voucher.minOrderAmount,
            stock: voucher.stock,
            perUserLimit: voucher.perUserLimit,
            isEnabled: voucher.isEnabled,
            startsAt: voucher.startsAt,
            endsAt: voucher.endsAt,
            usedCount: voucher.usedCount,
          }}
        />
      </div>
    </div>
  );
}
