import { ConsolePagination } from "@/components/console/console-pagination";
import { IncomeAnalyticsCharts } from "@/components/console/laporan/income-analytics-charts";
import { IncomeTable } from "@/components/console/laporan/income-table";
import { ReportAnalyticsKpi } from "@/components/console/laporan/report-analytics-kpi";
import { ReportAnalyticsToolbar } from "@/components/console/laporan/report-analytics-toolbar";
import { parsePagination } from "@/lib/console-pagination";
import { getIncomeDashboard } from "@/lib/reports/get-income-dashboard";
import { getReportIncomeRows } from "@/lib/reports/get-report-income";
import { resolveReportPeriod } from "@/lib/reports/report-period";

type PemasukanPageProps = {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function LaporanPemasukanPage({ searchParams }: PemasukanPageProps) {
  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const { page, pageSize, skip } = parsePagination(params);

  const [dashboard, income] = await Promise.all([
    getIncomeDashboard(period),
    getReportIncomeRows({
      period,
      skip,
      take: pageSize,
    }),
  ]);

  return (
    <div className="console-page console-report-analytics-page">
      <div className="console-report-analytics-intro">
        <div className="console-report-analytics-intro__copy">
          <p className="console-page-intro__eyebrow">Laporan</p>
          <h1 className="console-report-analytics-intro__title">Pemasukan</h1>
          <p className="console-report-analytics-intro__text">
            Analitik nilai transaksi order PAID, margin SKU, channel, dan daftar transaksi.
          </p>
        </div>

        <ReportAnalyticsToolbar
          basePath="/console/laporan/pemasukan"
          preset={period.preset}
          fromKey={period.fromKey}
          toKey={period.toKey}
        />
      </div>

      <ReportAnalyticsKpi metrics={dashboard.kpis} />

      <IncomeAnalyticsCharts data={dashboard} />

      <section className="console-panel">
        <div className="console-panel__head">
          <div>
            <h2 className="console-panel__title">Daftar transaksi</h2>
            <p className="console-panel__subtitle">
              Order PAID dalam periode terpilih · {income.total.toLocaleString("id-ID")} data
            </p>
          </div>
        </div>
        <IncomeTable items={income.items} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={income.total}
          basePath="/console/laporan/pemasukan"
          query={{
            preset: period.preset,
            from: period.preset === "custom" ? period.fromKey : undefined,
            to: period.preset === "custom" ? period.toKey : undefined,
            pageSize: params.pageSize,
          }}
        />
      </section>
    </div>
  );
}
