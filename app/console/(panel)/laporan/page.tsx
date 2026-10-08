import { ReportAnalyticsCharts } from "@/components/console/laporan/report-analytics-charts";
import { ReportAnalyticsKpi } from "@/components/console/laporan/report-analytics-kpi";
import { ReportAnalyticsToolbar } from "@/components/console/laporan/report-analytics-toolbar";
import { getReportDashboard } from "@/lib/reports/get-report-dashboard";
import { resolveReportPeriod } from "@/lib/reports/report-period";

type LaporanPageProps = {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
  }>;
};

function buildDownloadHref(period: {
  preset: string;
  fromKey: string;
  toKey: string;
}): string {
  const params = new URLSearchParams({ preset: period.preset });
  if (period.preset === "custom") {
    params.set("from", period.fromKey);
    params.set("to", period.toKey);
  }
  return `/console/laporan/export/download?${params.toString()}`;
}

export default async function LaporanRingkasanPage({ searchParams }: LaporanPageProps) {
  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const dashboard = await getReportDashboard(period);

  return (
    <div className="console-page console-report-analytics-page">
      <div className="console-report-analytics-intro">
        <div className="console-report-analytics-intro__copy">
          <p className="console-page-intro__eyebrow">Laporan</p>
          <h1 className="console-report-analytics-intro__title">Analitik Keuangan</h1>
          <p className="console-report-analytics-intro__text">
            Ringkasan kinerja, tren, dan komposisi keuangan berdasarkan margin SKU.
          </p>
        </div>

        <ReportAnalyticsToolbar
          basePath="/console/laporan"
          preset={period.preset}
          fromKey={period.fromKey}
          toKey={period.toKey}
          exportHref={buildDownloadHref(period)}
        />
      </div>

      <ReportAnalyticsKpi metrics={dashboard.kpis} />

      <ReportAnalyticsCharts data={dashboard} />
    </div>
  );
}
