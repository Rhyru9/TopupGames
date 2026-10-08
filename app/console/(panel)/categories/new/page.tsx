import { ConsolePageHeader } from "@/components/console/console-page-header";
import { GameTypeForm } from "@/components/console/categories/game-type-form";

export default function NewCategoryPage() {
  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title="Tambah Kategori"
        description="Buat jenis katalog baru untuk mengelompokkan game di storefront."
        backLink={{
          href: "/console/categories",
          label: "← Kembali ke daftar kategori",
        }}
      />

      <div className="console-panel console-panel--padded">
        <GameTypeForm mode="create" />
      </div>
    </div>
  );
}
