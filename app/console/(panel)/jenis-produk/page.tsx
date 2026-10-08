import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { ProductTypeAddButton } from "@/components/console/product-types/product-type-add-button";
import { ProductTypesTable } from "@/components/console/product-types/product-types-table";
import { loadAllProductTypes } from "@/lib/catalog-products/game-catalog-data";
import { getProductOptionsForSku } from "@/lib/catalog-products/game-options";
import { parsePagination } from "@/lib/console-pagination";

type JenisProdukPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function JenisProdukPage({ searchParams }: JenisProdukPageProps) {
  const params = await searchParams;
  const { page, pageSize, skip } = parsePagination(params);

  const [products, { productTypes, total }] = await Promise.all([
    getProductOptionsForSku(),
    loadAllProductTypes({ skip, take: pageSize }),
  ]);

  const productOptions = products.map((product) => ({ id: product.id, name: product.name }));

  if (products.length === 0) {
    return (
      <div className="console-page">
        <ConsolePageHeader
          eyebrow="Produk"
          title="Jenis Produk"
          description="Section filter di storefront per produk — Diamonds, Membership, dll."
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

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title="Jenis Produk"
        description="Section filter di storefront per produk — Diamonds, Membership, dll."
        actionsSlot={<ProductTypeAddButton products={productOptions} />}
      />

      <div className="console-panel">
        <ProductTypesTable products={productOptions} productTypes={productTypes} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/jenis-produk"
          query={{ pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
