import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { ArticleTable } from "@/components/console/artikel/article-table";
import { parsePagination } from "@/lib/console-pagination";
import { listArticles } from "@/lib/article/article-mutations";

type ArtikelPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function ArtikelPage({ searchParams }: ArtikelPageProps) {
  const params = await searchParams;
  const { page, pageSize, skip } = parsePagination(params);
  const { items, total } = await listArticles({ skip, take: pageSize });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Artikel"
        description="Kelola blog dan artikel SEO dengan cover image untuk traffic organik."
        action={{ href: "/console/artikel/new", label: "+ Tambah Artikel" }}
      />

      <div className="console-panel">
        <ArticleTable items={items} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/artikel"
          query={{ pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
