import { ConsolePageHeader } from "@/components/console/console-page-header";
import { GameForm } from "@/components/console/produk/game-form";
import { getActiveCatalogCategories } from "@/lib/catalog-categories/active-catalog-categories";

export default async function NewProdukPage() {
  const catalogCategories = await getActiveCatalogCategories();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title="Tambah Produk"
        description="Isi data produk baru untuk ditampilkan di storefront."
        backLink={{
          href: "/console/produk",
          label: "← Kembali ke daftar produk",
        }}
      />

      <div className="console-panel console-panel--padded">
        <GameForm mode="create" catalogCategories={catalogCategories} />
      </div>
    </div>
  );
}
