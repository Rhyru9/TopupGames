import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { ContentPageTable } from "@/components/console/halaman/content-page-table";
import { parsePagination } from "@/lib/console-pagination";
import { listContentPages } from "@/lib/content/content-page-mutations";

type HalamanPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function HalamanPage({ searchParams }: HalamanPageProps) {
  const params = await searchParams;
  const { page, pageSize, skip } = parsePagination(params);
  const { items, total } = await listContentPages({ skip, take: pageSize });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Halaman"
        description="Kelola halaman statis seperti kebijakan privasi, ketentuan layanan, dan info lain untuk footer."
        action={{ href: "/console/halaman/new", label: "+ Tambah Halaman" }}
      />

      <div className="console-panel">
        <ContentPageTable items={items} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/halaman"
          query={{ pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
