import { formatRupiah } from "@/lib/format-rupiah";
import type { OrderListItem } from "@/lib/orders/list-orders";
import {
  ORDER_FULFILLMENT_STATUS_LABEL,
  ORDER_PAYMENT_STATUS_LABEL,
  type OrderFulfillmentStatusValue,
  type OrderPaymentStatusValue,
} from "@/lib/orders/order-status-labels";
import { OrderRowActions } from "@/components/console/orders/order-row-actions";

type OrdersTableProps = {
  orders: OrderListItem[];
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

function fulfillmentBadgeClass(status: string) {
  if (status === "SUCCESS") return "console-badge--success";
  if (status === "QUEUED" || status === "PROCESSING") return "console-badge--warning";
  if (status === "FAILED" || status === "CANCELLED") return "console-badge--danger";
  return "console-badge--muted";
}

export function OrdersTable({ orders, hasFilters = false }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="console-empty">
        <p className="console-empty__title">
          {hasFilters ? "Tidak ada pesanan cocok" : "Belum ada pesanan"}
        </p>
        <p className="console-empty__text">
          {hasFilters
            ? "Coba ubah filter atau kata kunci."
            : "Pesanan akan muncul di sini setelah ada transaksi masuk."}
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
            <th>Produk / player</th>
            <th>Provider</th>
            <th className="console-table__count-head">Total</th>
            <th>Bayar</th>
            <th>Status top-up</th>
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
                  <p className="console-table__muted">
                    {order.email || order.whatsapp || "—"}
                  </p>
                </td>
                <td>
                  <p className="console-table__primary">{order.productNameSnapshot}</p>
                  <p className="console-table__muted">{order.skuNameSnapshot}</p>
                  {order.playerLabel ? (
                    <p className="console-table__muted">{order.playerLabel}</p>
                  ) : null}
                </td>
                <td>
                  <p className="console-table__primary">{order.providerSlug || "—"}</p>
                  {order.providerSkuSnapshot ? (
                    <p className="console-table__muted">{order.providerSkuSnapshot}</p>
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
                  {order.fulfillmentMessage ? (
                    <p className="console-table__muted" style={{ marginTop: "0.35rem" }}>
                      {order.fulfillmentMessage.length > 80
                        ? `${order.fulfillmentMessage.slice(0, 80)}…`
                        : order.fulfillmentMessage}
                    </p>
                  ) : null}
                </td>
                <td>
                  <span className="console-table__cell-text">
                    {formatDateTime(order.createdAt)}
                  </span>
                </td>
                <td className="console-table__actions-cell">
                  <OrderRowActions orderId={order.id} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
