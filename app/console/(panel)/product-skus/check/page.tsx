import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ProductSkuAvailabilityCheckPage } from "@/components/console/product-skus/product-sku-availability-check-page";
import { getSkuCheckScopeOptions } from "@/app/console/(panel)/product-skus/check-actions";

type ProductSkuCheckPageProps = {
  searchParams: Promise<{ ids?: string; productId?: string; providerId?: string }>;
};

export default async function ProductSkuCheckPage({ searchParams }: ProductSkuCheckPageProps) {
  const params = await searchParams;
  const skuIds = (params.ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const initialProductId = params.productId?.trim() || "";
  const initialProviderId = params.providerId?.trim() || "";

  const scopeOptions = await getSkuCheckScopeOptions();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title="Cek ketersediaan SKU"
        description="Pilih lingkup cek dulu, lalu jalankan. Hasil per SKU: tersedia, gangguan, tidak ketemu, atau gagal dicek."
        backLink={{ href: "/console/product-skus", label: "← Kembali ke daftar SKU" }}
      />

      <ProductSkuAvailabilityCheckPage
        scopeOptions={scopeOptions}
        initialSkuIds={skuIds.length > 0 ? skuIds : undefined}
        initialProductId={initialProductId || undefined}
        initialProviderId={initialProviderId || undefined}
      />
    </div>
  );
}
