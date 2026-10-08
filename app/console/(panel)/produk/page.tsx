import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { GameTable } from "@/components/console/produk/game-table";
import { parsePagination } from "@/lib/console-pagination";
import { prisma } from "@/lib/prisma";

type ProdukPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function ProdukPage({ searchParams }: ProdukPageProps) {
  const params = await searchParams;
  const { page, pageSize, skip } = parsePagination(params);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: pageSize,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        category: { select: { name: true } },
        _count: { select: { skus: true } },
      },
    }),
    prisma.product.count(),
  ]);

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title="Produk"
        description="Kelola produk dan layanan top-up per kategori."
        action={{ href: "/console/produk/new", label: "+ Tambah Produk" }}
      />

      <div className="console-panel">
        <GameTable products={products} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/produk"
          query={{ pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
