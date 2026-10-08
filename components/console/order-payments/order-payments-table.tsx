import Link from "next/link";
import { formatRupiah } from "@/lib/format-rupiah";
import type { OrderPaymentListItem } from "@/lib/orders/list-order-payments";
import {
  ORDER_PAYMENT_STATUS_LABEL,
  type OrderPaymentStatusValue,
} from "@/lib/orders/order-status-labels";

type OrderPaymentsTableProps = {
  payments: OrderPaymentListItem[];
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

export function OrderPaymentsTable({ payments, hasFilters = false }: OrderPaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <div className="console-empty">
        <p className="console-empty__title">
          {hasFilters ? "Tidak ada pembayaran cocok" : "Belum ada pembayaran pesanan"}
        </p>
        <p className="console-empty__text">
          {hasFilters
            ? "Coba ubah filter atau kata kunci."
            : "Data muncul setelah checkout membuat transaksi payment gateway."}
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--orders">
        <thead>
          <tr>
            <th>Kode order</th>
            <th>Produk</th>
            <th className="console-table__count-head">Amount</th>
            <th>Metode</th>
            <th>Status bayar</th>
            <th>Waktu</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const status = payment.status as OrderPaymentStatusValue;
            return (
              <tr key={payment.id}>
                <td>
                  <p className="console-table__primary">{payment.orderCode || "—"}</p>
                  <p className="console-table__muted">{payment.reference}</p>
                </td>
                <td>
                  <span className="console-table__cell-text">{payment.productName || "—"}</span>
                </td>
                <td className="console-table__count-cell">{formatRupiah(payment.amount)}</td>
                <td>
                  <p className="console-table__primary">
                    {payment.channelName || payment.channel}
                  </p>
                  <p className="console-table__muted">{payment.provider}</p>
                </td>
                <td>
                  <span className={`console-badge ${paymentBadgeClass(status)}`}>
                    {ORDER_PAYMENT_STATUS_LABEL[status]}
                  </span>
                </td>
                <td>
                  <span className="console-table__cell-text">
                    {formatDateTime(payment.paidAt ?? payment.createdAt)}
                  </span>
                </td>
                <td className="console-table__actions-cell">
                  <Link
                    href={`/console/order-payments/${payment.id}`}
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
