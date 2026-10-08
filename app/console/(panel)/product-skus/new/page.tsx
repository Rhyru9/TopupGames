import Link from "next/link";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ProductForm } from "@/components/console/product-skus/product-form";
import { getActiveFulfillmentProviders } from "@/lib/fulfillment-providers";
import { getAllProductTypeOptions } from "@/lib/catalog-products/game-catalog-data";
import { getProductOptionsForSku } from "@/lib/catalog-products/game-options";

type NewProductSkuPageProps = {
  searchParams: Promise<{ productId?: string; gameId?: string; provider?: string }>;
};

export default async function NewProductSkuPage({ searchParams }: NewProductSkuPageProps) {
  const params = await searchParams;
  const legacyProductId = params.productId ?? params.gameId;
  const [products, providers, productTypes] = await Promise.all([
    getProductOptionsForSku(),
    getActiveFulfillmentProviders(),
    getAllProductTypeOptions(),
  ]);

  if (products.length === 0 || providers.length === 0) {
    return (
      <div className="console-page">
        <ConsolePageHeader
          eyebrow="Produk"
          title="Tambah SKU"
          description="Belum ada produk atau provider aktif. Tambahkan data master terlebih dahulu."
          backLink={{ href: "/console/product-skus", label: "← Kembali ke daftar SKU" }}
        />
        <div className="console-panel console-panel--padded">
          <div className="console-alert console-alert--error" role="alert">
            {products.length === 0 ? (
              <>
                Belum ada produk induk. Buat dulu di menu{" "}
                <Link href="/console/produk/new" className="console-table__link">
                  Produk → Tambah Produk
                </Link>
                , lalu kembali ke halaman ini.
              </>
            ) : (
              "Tidak ada provider aktif. Aktifkan provider di Pengaturan → Provider."
            )}
          </div>
        </div>
      </div>
    );
  }

  const manualProvider = providers.find((provider) => provider.slug === "manual");
  const requestedProvider =
    params.provider === "manual"
      ? manualProvider
      : providers.find((provider) => provider.slug === params.provider);

  const defaultProductId =
    legacyProductId && products.some((product) => product.id === legacyProductId)
      ? legacyProductId
      : products[0].id;
  const defaultProviderId = requestedProvider?.id ?? manualProvider?.id ?? providers[0].id;

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title="Tambah SKU"
        description="Untuk SKU khusus tanpa API: pilih provider Manual. Order nanti diproses admin, bukan auto ke Digiflazz/Melostore."
        backLink={{ href: "/console/product-skus", label: "← Kembali ke daftar SKU" }}
      />

      <div className="console-panel console-panel--padded">
        <ProductForm
          mode="create"
          products={products}
          providers={providers}
          productTypes={productTypes}
          initialValues={{ productId: defaultProductId, providerId: defaultProviderId }}
        />
      </div>
    </div>
  );
}
