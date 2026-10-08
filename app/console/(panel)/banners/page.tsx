import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { BannerTable } from "@/components/console/banners/banner-table";
import { listBanners } from "@/lib/content/banner-mutations";
import { parsePagination } from "@/lib/console-pagination";

type BannersPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function BannersPage({ searchParams }: BannersPageProps) {
  const params = await searchParams;
  const { page, pageSize, skip } = parsePagination(params);
  const { banners, total } = await listBanners({ skip, take: pageSize });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Banner"
        description="Kelola slider banner di beranda. Urutan kecil tampil lebih dulu."
        action={{ href: "/console/banners/new", label: "+ Tambah Banner" }}
      />

      <div className="console-panel">
        <BannerTable banners={banners} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/banners"
          query={{ pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
