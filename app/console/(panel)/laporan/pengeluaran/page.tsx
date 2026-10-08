import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { ExpenseTable } from "@/components/console/laporan/expense-table";
import { ReportAnalyticsToolbar } from "@/components/console/laporan/report-analytics-toolbar";
import { parsePagination } from "@/lib/console-pagination";
import { listExpenses } from "@/lib/reports/get-expense-mutations";
import { resolveReportPeriod } from "@/lib/reports/report-period";

type PengeluaranPageProps = {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function LaporanPengeluaranPage({ searchParams }: PengeluaranPageProps) {
  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const { page, pageSize, skip } = parsePagination(params);
  const { items, total } = await listExpenses({
    from: period.from,
    to: period.to,
    skip,
    take: pageSize,
  });

  return (
    <div className="console-page">
      <div className="console-report-analytics-intro console-report-list-intro">
        <ConsolePageHeader
          eyebrow="Laporan"
          title="Pengeluaran"
          description="Catat beban operasional, iklan, infrastruktur, dan biaya lain."
          action={{ href: "/console/laporan/pengeluaran/new", label: "+ Tambah pengeluaran" }}
        />

        <ReportAnalyticsToolbar
          basePath="/console/laporan/pengeluaran"
          preset={period.preset}
          fromKey={period.fromKey}
          toKey={period.toKey}
        />
      </div>

      <div className="console-panel">
        <ExpenseTable items={items} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/laporan/pengeluaran"
          query={{
            preset: period.preset,
            from: period.preset === "custom" ? period.fromKey : undefined,
            to: period.preset === "custom" ? period.toKey : undefined,
            pageSize: params.pageSize,
          }}
        />
      </div>
    </div>
  );
}
