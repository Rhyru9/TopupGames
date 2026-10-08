import Link from "next/link";
import { ExpenseRowActions } from "@/components/console/laporan/expense-row-actions";
import {
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategoryValue,
} from "@/lib/reports/expense-labels";
import { formatReportDate, formatReportRupiah } from "@/lib/reports/report-format";
import type { ExpenseListItem } from "@/lib/reports/report-types";

type ExpenseTableProps = {
  items: ExpenseListItem[];
};

export function ExpenseTable({ items }: ExpenseTableProps) {
  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Kategori</th>
            <th>Deskripsi</th>
            <th>Nominal</th>
            <th>Admin</th>
            <th>Bukti</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="console-table__empty">
                Belum ada pengeluaran. Tambah beban operasional, iklan, atau biaya lain.
              </td>
            </tr>
          ) : (
            items.map((row) => (
              <tr key={row.id}>
                <td>{formatReportDate(row.date)}</td>
                <td>
                  {EXPENSE_CATEGORY_LABEL[row.category as ExpenseCategoryValue] ?? row.category}
                </td>
                <td>
                  <span className="console-table__primary">{row.description}</span>
                </td>
                <td>{formatReportRupiah(row.amount)}</td>
                <td>{row.createdByName ?? "—"}</td>
                <td>
                  {row.receiptUrl ? (
                    <Link
                      href={row.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="console-table__link"
                    >
                      Lihat
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <ExpenseRowActions expenseId={row.id} description={row.description} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
