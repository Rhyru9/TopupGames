import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { TickerTable } from "@/components/console/ticker/ticker-table";
import { parsePagination } from "@/lib/console-pagination";
import { listTickerItems } from "@/lib/content/ticker-mutations";

type TickerPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function TickerPage({ searchParams }: TickerPageProps) {
  const params = await searchParams;
  const { page, pageSize, skip } = parsePagination(params);
  const { items, total } = await listTickerItems({ skip, take: pageSize });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Teks Berjalan"
        description="Isi ticker beranda: label kiri (game/kategori) + detail kanan (promo singkat)."
        action={{ href: "/console/ticker/new", label: "+ Tambah Item" }}
      />

      <div className="console-panel">
        <TickerTable items={items} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/ticker"
          query={{ pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
