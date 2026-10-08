import { ConsolePageHeader } from "@/components/console/console-page-header";
import { SeoEntityTable } from "@/components/console/seo/seo-entity-table";
import { SeoGlobalPanel } from "@/components/console/seo/seo-global-panel";
import { SeoOverview } from "@/components/console/seo/seo-overview";
import { SeoSnippetPreview } from "@/components/console/seo/seo-snippet-preview";
import { getSeoReport } from "@/lib/seo/get-seo-report";
import Link from "next/link";

const TABS = [
  { slug: "global", label: "Global" },
  { slug: "articles", label: "Artikel" },
  { slug: "products", label: "Produk" },
  { slug: "pages", label: "Halaman" },
] as const;

type SeoTab = (typeof TABS)[number]["slug"];

type SeoPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function resolveTab(raw?: string): SeoTab {
  if (raw === "articles" || raw === "products" || raw === "pages" || raw === "global") {
    return raw;
  }
  return "global";
}

export default async function ConsoleSeoPage({ searchParams }: SeoPageProps) {
  const params = await searchParams;
  const tab = resolveTab(params.tab);
  const report = await getSeoReport();

  const focusEntity =
    tab === "articles"
      ? report.articles.find((e) => e.severity !== "ok") ?? report.articles[0]
      : tab === "products"
        ? report.products.find((e) => e.severity !== "ok") ?? report.products[0]
        : tab === "pages"
          ? report.pages.find((e) => e.severity !== "ok") ?? report.pages[0]
          : report.global;

  return (
    <div className="console-page console-seo-page">
      <ConsolePageHeader
        eyebrow="Pengaturan"
        title="Analisis SEO"
        description="Checklist meta, preview cuplikan Google, dan rekomendasi perbaikan untuk situs, artikel, produk, dan halaman."
      />

      <SeoOverview
        summary={report.summary}
        sitemapUrl={report.sitemapUrl}
        robotsUrl={report.robotsUrl}
      />

      <div className="console-seo-body">
        <nav className="console-seo-tabs" aria-label="Bagian analisis SEO">
          {TABS.map((item) => {
            const active = item.slug === tab;
            const count =
              item.slug === "articles"
                ? report.articles.length
                : item.slug === "products"
                  ? report.products.length
                  : item.slug === "pages"
                    ? report.pages.length
                    : 1;
            return (
              <Link
                key={item.slug}
                href={
                  item.slug === "global"
                    ? "/console/settings/seo"
                    : `/console/settings/seo?tab=${item.slug}`
                }
                className={`console-seo-tabs__item${active ? " is-active" : ""}`}
              >
                {item.label}
                <span className="console-seo-tabs__count">{count}</span>
              </Link>
            );
          })}
        </nav>

        <div className="console-seo-body__content">
          {tab === "global" ? (
            <SeoGlobalPanel entity={report.global} />
          ) : (
            <div className="console-seo-section">
              {focusEntity ? (
                <SeoSnippetPreview
                  title={focusEntity.snippetTitle}
                  urlLabel={focusEntity.snippetUrl}
                  description={focusEntity.snippetDescription}
                  caption="Contoh cuplikan (item pertama bermasalah / teratas)"
                />
              ) : null}

              {tab === "articles" ? (
                <SeoEntityTable
                  entities={report.articles}
                  emptyLabel="Belum ada artikel aktif untuk diaudit."
                />
              ) : null}
              {tab === "products" ? (
                <SeoEntityTable
                  entities={report.products}
                  emptyLabel="Belum ada produk aktif untuk diaudit."
                />
              ) : null}
              {tab === "pages" ? (
                <SeoEntityTable
                  entities={report.pages}
                  emptyLabel="Belum ada halaman aktif untuk diaudit."
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
