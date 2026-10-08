import Link from "next/link";
import { formatRupiah } from "@/lib/format-rupiah";
import type { AdminDepositListItem } from "@/lib/member/list-admin-deposits";
import {
  ORDER_PAYMENT_STATUS_LABEL,
  type OrderPaymentStatusValue,
} from "@/lib/orders/order-status-labels";

type DepositsTableProps = {
  deposits: AdminDepositListItem[];
  hasFilters?: boolean;
};

function formatDateTime(value: Date) {
  return value.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentBadgeClass(status: string) {
  if (status === "PAID") return "console-badge--success";
  if (status === "UNPAID") return "console-badge--warning";
  if (status === "EXPIRED" || status === "FAILED") return "console-badge--danger";
  return "console-badge--muted";
}

export function DepositsTable({ deposits, hasFilters = false }: DepositsTableProps) {
  if (deposits.length === 0) {
    return (
      <div className="console-empty">
        <p className="console-empty__title">
          {hasFilters ? "Tidak ada deposit cocok" : "Belum ada deposit"}
        </p>
        <p className="console-empty__text">
          {hasFilters
            ? "Coba ubah filter atau kata kunci."
            : "Deposit muncul setelah member topup saldo via DOKU."}
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--orders">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Member</th>
            <th className="console-table__count-head">Kredit</th>
            <th className="console-table__count-head">Total bayar</th>
            <th>Status</th>
            <th>Waktu</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((dep) => {
            const status = dep.paymentStatus as OrderPaymentStatusValue;
            return (
              <tr key={dep.id}>
                <td>
                  <p className="console-table__primary">{dep.depositCode}</p>
                  {dep.channel ? (
                    <p className="console-table__muted">{dep.channel}</p>
                  ) : null}
                </td>
                <td>
                  <p className="console-table__primary">{dep.member.name}</p>
                  <p className="console-table__muted">{dep.member.email}</p>
                </td>
                <td className="console-table__count-cell">{formatRupiah(dep.amount)}</td>
                <td className="console-table__count-cell">
                  {formatRupiah(dep.totalAmount)}
                  {dep.feeSnapshot > 0 ? (
                    <p className="console-table__muted">fee {formatRupiah(dep.feeSnapshot)}</p>
                  ) : null}
                </td>
                <td>
                  <span className={`console-badge ${paymentBadgeClass(status)}`}>
                    {ORDER_PAYMENT_STATUS_LABEL[status]}
                  </span>
                </td>
                <td>
                  <span className="console-table__cell-text">
                    {formatDateTime(dep.createdAt)}
                  </span>
                </td>
                <td className="console-table__actions-cell">
                  <Link
                    href={`/console/deposits/${dep.id}`}
                    className="console-table__link console-table__link--small"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
