import Link from "next/link";
import { formatReportDateTime, formatReportRupiah } from "@/lib/reports/report-format";
import type { ReportIncomeRow } from "@/lib/reports/report-types";

type IncomeTableProps = {
  items: ReportIncomeRow[];
};

export function IncomeTable({ items }: IncomeTableProps) {
  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th>Tanggal bayar</th>
            <th>Kode order</th>
            <th>Nominal</th>
            <th>Channel</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="console-table__empty">
                Tidak ada pendapatan order pada periode ini.
              </td>
            </tr>
          ) : (
            items.map((row) => (
              <tr key={row.id}>
                <td>{formatReportDateTime(row.paidAt)}</td>
                <td>
                  <span className="console-table__primary">{row.code}</span>
                </td>
                <td>{formatReportRupiah(row.amount)}</td>
                <td>{row.channel ?? "—"}</td>
                <td>
                  <Link href={row.href} className="console-table__link">
                    Detail
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
