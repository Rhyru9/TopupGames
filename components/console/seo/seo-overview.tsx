import Link from "next/link";
import type { SeoReportSummary } from "@/lib/seo/get-seo-report";

type SeoOverviewProps = {
  summary: SeoReportSummary;
  sitemapUrl: string;
  robotsUrl: string;
};

export function SeoOverview({ summary, sitemapUrl, robotsUrl }: SeoOverviewProps) {
  return (
    <div className="console-seo-overview console-panel console-panel--padded">
      <div className="console-seo-kpi" role="group" aria-label="Ringkasan audit SEO">
        <div className="console-seo-kpi__card console-seo-kpi__card--ok">
          <span className="console-seo-kpi__label">OK</span>
          <span className="console-seo-kpi__value">{summary.ok}</span>
        </div>
        <div className="console-seo-kpi__card console-seo-kpi__card--warn">
          <span className="console-seo-kpi__label">Peringatan</span>
          <span className="console-seo-kpi__value">{summary.warn}</span>
        </div>
        <div className="console-seo-kpi__card console-seo-kpi__card--fail">
          <span className="console-seo-kpi__label">Gagal</span>
          <span className="console-seo-kpi__value">{summary.fail}</span>
        </div>
        <div className="console-seo-kpi__card">
          <span className="console-seo-kpi__label">Total</span>
          <span className="console-seo-kpi__value">{summary.total}</span>
        </div>
      </div>

      <div className="console-seo-overview__links">
        <Link href="/console/settings/website?section=seo" className="console-btn-primary">
          Edit SEO situs
        </Link>
        <a href={sitemapUrl} target="_blank" rel="noreferrer" className="console-seo-overview__link">
          sitemap.xml
        </a>
        <a href={robotsUrl} target="_blank" rel="noreferrer" className="console-seo-overview__link">
          robots.txt
        </a>
      </div>
    </div>
  );
}
