import Link from "next/link";
import { formatRupiah } from "@/lib/format-rupiah";
import type { DashboardRecentOrder } from "@/lib/dashboard/get-console-dashboard";
import {
  ORDER_FULFILLMENT_STATUS_LABEL,
  ORDER_PAYMENT_STATUS_LABEL,
  type OrderFulfillmentStatusValue,
  type OrderPaymentStatusValue,
} from "@/lib/orders/order-status-labels";
import {
  ConsoleIconButton,
  ConsoleIconView,
} from "@/components/console/console-icon-button";

type DashboardRecentOrdersTableProps = {
  orders: DashboardRecentOrder[];
};

function formatDateTime(value: Date) {
  return value.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
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

function fulfillmentBadgeClass(status: string) {
  if (status === "SUCCESS") return "console-badge--success";
  if (status === "QUEUED" || status === "PROCESSING") return "console-badge--warning";
  if (status === "FAILED" || status === "CANCELLED") return "console-badge--danger";
  return "console-badge--muted";
}

export function DashboardRecentOrdersTable({ orders }: DashboardRecentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="console-empty">
        <p className="console-empty__title">Belum ada pesanan</p>
        <p className="console-empty__text">
          Order terbaru akan muncul di sini setelah ada transaksi masuk.
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Produk</th>
            <th className="console-table__count-head">Total</th>
            <th>Bayar</th>
            <th>Top-up</th>
            <th>Waktu</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const pay = order.paymentStatus as OrderPaymentStatusValue;
            const fulfill = order.fulfillmentStatus as OrderFulfillmentStatusValue;
            return (
              <tr key={order.id}>
                <td>
                  <p className="console-table__primary">{order.orderCode}</p>
                </td>
                <td>
                  <p className="console-table__primary">{order.productNameSnapshot}</p>
                  <p className="console-table__muted">{order.skuNameSnapshot}</p>
                  {order.playerLabel ? (
                    <p className="console-table__muted">{order.playerLabel}</p>
                  ) : null}
                </td>
                <td className="console-table__count-cell">{formatRupiah(order.amount)}</td>
                <td>
                  <span className={`console-badge ${paymentBadgeClass(pay)}`}>
                    {ORDER_PAYMENT_STATUS_LABEL[pay]}
                  </span>
                </td>
                <td>
                  <span className={`console-badge ${fulfillmentBadgeClass(fulfill)}`}>
                    {ORDER_FULFILLMENT_STATUS_LABEL[fulfill]}
                  </span>
                </td>
                <td>
                  <span className="console-table__cell-text">{formatDateTime(order.createdAt)}</span>
                </td>
                <td className="console-table__actions-cell">
                  <div className="console-table__actions">
                    <ConsoleIconButton
                      href={`/console/orders/${order.id}`}
                      title="Lihat detail"
                      variant="default"
                    >
                      <ConsoleIconView />
                    </ConsoleIconButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardRecentOrdersSection({ orders }: DashboardRecentOrdersTableProps) {
  return (
    <div className="console-panel">
      <div className="console-panel__head console-dashboard-recent__head">
        <div>
          <h2 className="console-panel__title">Order terbaru</h2>
          <p className="console-panel__subtitle">7 pesanan terakhir masuk</p>
        </div>
        <Link href="/console/orders" className="console-btn-secondary">
          Lihat semua
        </Link>
      </div>
      <DashboardRecentOrdersTable orders={orders} />
    </div>
  );
}
