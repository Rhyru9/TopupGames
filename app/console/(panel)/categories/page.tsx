import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { GameTypeTable } from "@/components/console/categories/game-type-table";
import { parsePagination } from "@/lib/console-pagination";
import { prisma } from "@/lib/prisma";

type CategoriesPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams;
  const { page, pageSize, skip } = parsePagination(params);

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take: pageSize,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: true } },
      },
    }),
    prisma.category.count(),
  ]);

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title="Kategori"
        description="Jenis katalog storefront — Topup Game, Voucher, Pulsa & Data, dan lainnya."
        action={{ href: "/console/categories/new", label: "+ Tambah Kategori" }}
      />

      <div className="console-panel">
        <GameTypeTable categories={categories} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/categories"
          query={{ pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
