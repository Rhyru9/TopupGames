import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { GameForm } from "@/components/console/produk/game-form";
import { resolveGameInputFields } from "@/lib/catalog-products/game-input-fields";
import { getActiveCatalogCategories } from "@/lib/catalog-categories/active-catalog-categories";
import { prisma } from "@/lib/prisma";

type EditProdukPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProdukPage({ params }: EditProdukPageProps) {
  const { id } = await params;

  const [product, catalogCategories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    getActiveCatalogCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title={`Edit ${product.name}`}
        description="Perbarui informasi produk. Brand provider diatur per SKU di halaman SKU Produk."
        backLink={{
          href: "/console/produk",
          label: "← Kembali ke daftar produk",
        }}
      />

      <div className="console-panel console-panel--padded">
        <GameForm
          mode="edit"
          productId={product.id}
          catalogCategories={catalogCategories}
          initialValues={{
            name: product.name,
            subtitle: product.subtitle,
            slug: product.slug,
            categoryId: product.categoryId,
            isPopular: product.isPopular,
            soldCount: product.soldCount,
            requiresLogin: product.requiresLogin,
            status: product.status,
            thumbnailUrl: product.thumbnailUrl,
            bannerUrl: product.bannerUrl,
            inputFields: resolveGameInputFields(product.inputFields, product.requiresZone),
            nicknameCheckCode: product.nicknameCheckCode ?? "",
            guideHtml: product.guideHtml ?? "",
            fieldHintHtml: product.fieldHintHtml ?? "",
            sortOrder: product.sortOrder,
          }}
        />
      </div>
    </div>
  );
}
