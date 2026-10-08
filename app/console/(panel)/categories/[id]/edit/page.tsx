import { ConsolePageHeader } from "@/components/console/console-page-header";
import { GameTypeForm } from "@/components/console/categories/game-type-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title={`Edit Kategori — ${category.name}`}
        description="Ubah nama, slug, urutan, atau status kategori."
        backLink={{
          href: "/console/categories",
          label: "← Kembali ke daftar kategori",
        }}
      />

      <div className="console-panel console-panel--padded">
        <GameTypeForm
          mode="edit"
          categoryId={category.id}
          initialValues={{
            name: category.name,
            slug: category.slug,
            iconUrl: category.iconUrl ?? "",
            sortOrder: category.sortOrder,
            isActive: category.isActive,
            defaultRequiresLogin: category.defaultRequiresLogin,
          }}
        />
      </div>
    </div>
  );
}
