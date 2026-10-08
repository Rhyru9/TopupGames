import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { PopupTable } from "@/components/console/popup/popup-table";
import { parsePagination } from "@/lib/console-pagination";
import { listPopups } from "@/lib/content/popup-mutations";

type PopupPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function PopupPage({ searchParams }: PopupPageProps) {
  const params = await searchParams;
  const { page, pageSize, skip } = parsePagination(params);
  const { items, total } = await listPopups({ skip, take: pageSize });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Popup"
        description="Popup promo di beranda, katalog, dan detail produk. Mode gambar atau teks."
        action={{ href: "/console/popup/new", label: "+ Tambah Popup" }}
      />

      <div className="console-panel">
        <PopupTable items={items} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/popup"
          query={{ pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
