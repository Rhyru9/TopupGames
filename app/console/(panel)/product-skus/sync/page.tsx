import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ProductSyncPage } from "@/components/console/product-skus/product-sync-page";
import { getConfiguredSyncProviders } from "@/lib/fulfillment-providers";
import { getProductOptionsForSku } from "@/lib/catalog-products/game-options";

type NominalSyncPageProps = {
  searchParams: Promise<{ productId?: string; gameId?: string; providerId?: string }>;
};

export default async function NominalSyncPage({ searchParams }: NominalSyncPageProps) {
  const { productId: productIdParam, gameId: gameIdParam, providerId: providerIdParam } =
    await searchParams;
  const legacyProductId = productIdParam ?? gameIdParam;
  const [products, syncProviders] = await Promise.all([
    getProductOptionsForSku(),
    getConfiguredSyncProviders(),
  ]);

  if (products.length === 0) {
    return (
      <div className="console-page">
        <ConsolePageHeader
          eyebrow="Produk"
          title="Sync SKU"
          description="Import SKU dari provider ke daftar produk."
          backLink={{ href: "/console/product-skus", label: "← Kembali ke daftar SKU" }}
        />
        <div className="console-panel console-panel--padded">
          <div className="console-empty">
            <p className="console-empty__title">Belum ada produk</p>
            <p className="console-empty__text">Buat produk terlebih dahulu di menu Produk.</p>
          </div>
        </div>
      </div>
    );
  }

  if (syncProviders.length === 0) {
    return (
      <div className="console-page">
        <ConsolePageHeader
          eyebrow="Produk"
          title="Sync SKU"
          description="Import SKU dari provider ke daftar produk."
          backLink={{ href: "/console/product-skus", label: "← Kembali ke daftar SKU" }}
        />
        <div className="console-panel console-panel--padded">
          <div className="console-alert console-alert--error" role="alert">
            Tidak ada provider sync yang aktif dan sudah dikonfigurasi. Lengkapi kredensial di Pengaturan Provider.
          </div>
        </div>
      </div>
    );
  }

  // Jangan auto-pilih produk pertama — wajib dipilih manual agar tidak salah pengelompokan.
  const initialProductId =
    legacyProductId && products.some((product) => product.id === legacyProductId)
      ? legacyProductId
      : "";

  const initialProviderId =
    providerIdParam && syncProviders.some((provider) => provider.id === providerIdParam)
      ? providerIdParam
      : syncProviders[0].id;

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title="Sync SKU"
        description="Atur filter provider, muat daftar SKU, lalu simpan batch per jenis produk."
        backLink={{ href: "/console/product-skus", label: "← Kembali ke daftar SKU" }}
      />

      <ProductSyncPage
        key={`${initialProductId}-${initialProviderId}`}
        initialProductId={initialProductId}
        initialProviderId={initialProviderId}
        products={products}
        providers={syncProviders}
      />
    </div>
  );
}
