import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { formatRupiah } from "@/lib/format-rupiah";
import { getOrderPaymentAdminDetail } from "@/lib/orders/list-order-payments";
import {
  ORDER_FULFILLMENT_STATUS_LABEL,
  ORDER_PAYMENT_STATUS_LABEL,
  type OrderFulfillmentStatusValue,
  type OrderPaymentStatusValue,
} from "@/lib/orders/order-status-labels";

type OrderPaymentDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
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

export default async function ConsoleOrderPaymentDetailPage({
  params,
}: OrderPaymentDetailPageProps) {
  const { id } = await params;
  const payment = await getOrderPaymentAdminDetail(id);
  if (!payment || !payment.orderId) notFound();

  const payStatus = payment.status as OrderPaymentStatusValue;
  const order = payment.order;
  const fulfillStatus = order?.fulfillmentStatus as OrderFulfillmentStatusValue | undefined;

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Pembayaran Pesanan"
        title={order?.orderCode ?? payment.reference}
        description={`${payment.channelName || payment.channel} — ${payment.provider}`}
        backLink={{ href: "/console/order-payments", label: "← Kembali ke pembayaran" }}
      />

      <div className="console-order-detail">
        <section className="console-panel console-panel--padded">
          <div className="console-order-detail__stats">
            <div className="console-order-detail__stat">
              <span className="console-order-detail__stat-label">Amount</span>
              <strong className="console-order-detail__stat-value console-order-detail__stat-value--accent">
                {formatRupiah(payment.amount)}
              </strong>
            </div>
            <div className="console-order-detail__stat">
              <span className="console-order-detail__stat-label">Status bayar</span>
              <span className={`console-badge ${paymentBadgeClass(payStatus)}`}>
                {ORDER_PAYMENT_STATUS_LABEL[payStatus]}
              </span>
            </div>
            <div className="console-order-detail__stat">
              <span className="console-order-detail__stat-label">Dibayar</span>
              <strong className="console-order-detail__stat-value">
                {formatDateTime(payment.paidAt)}
              </strong>
            </div>
            <div className="console-order-detail__stat">
              <span className="console-order-detail__stat-label">Dibuat</span>
              <strong className="console-order-detail__stat-value">
                {formatDateTime(payment.createdAt)}
              </strong>
            </div>
          </div>
        </section>

        <div className="console-order-detail__grid">
          <section className="console-panel console-panel--padded">
            <h2 className="console-order-detail__section-title">Pembayaran</h2>
            <dl className="console-order-detail__fields">
              <div className="console-order-detail__field">
                <dt>Gateway</dt>
                <dd>{payment.provider}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Metode</dt>
                <dd>{payment.channelName || payment.channel}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Reference</dt>
                <dd>
                  <code className="console-order-detail__code">{payment.reference}</code>
                </dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Kode bayar / VA</dt>
                <dd>{payment.payCode || "—"}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>QR</dt>
                <dd>
                  {payment.qrUrl ? (
                    <a
                      href={payment.qrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="console-table__link"
                    >
                      Buka QR
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Checkout URL</dt>
                <dd>
                  {payment.checkoutUrl ? (
                    <a
                      href={payment.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="console-table__link"
                    >
                      Buka link
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Kadaluarsa</dt>
                <dd>{formatDateTime(payment.expiredAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="console-panel console-panel--padded">
            <h2 className="console-order-detail__section-title">Pesanan terkait</h2>
            {order ? (
              <dl className="console-order-detail__fields">
                <div className="console-order-detail__field">
                  <dt>Kode</dt>
                  <dd>
                    <Link href={`/console/orders/${order.id}`} className="console-table__link">
                      {order.orderCode}
                    </Link>
                  </dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Produk</dt>
                  <dd>
                    {order.productNameSnapshot} — {order.skuNameSnapshot}
                  </dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Total order</dt>
                  <dd>{formatRupiah(order.amount)}</dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Status bayar order</dt>
                  <dd>
                    {
                      ORDER_PAYMENT_STATUS_LABEL[
                        order.paymentStatus as OrderPaymentStatusValue
                      ]
                    }
                  </dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Status top-up</dt>
                  <dd>
                    {fulfillStatus
                      ? ORDER_FULFILLMENT_STATUS_LABEL[fulfillStatus]
                      : "—"}
                  </dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Kontak</dt>
                  <dd>{order.email || order.whatsapp || "—"}</dd>
                </div>
              </dl>
            ) : (
              <p className="console-order-detail__empty">Order tidak ditemukan.</p>
            )}
          </section>
        </div>

        <section className="console-panel console-panel--padded">
          <h2 className="console-order-detail__section-title">Respons payment gateway</h2>
          <div className="console-order-detail__logs">
            <details className="console-order-detail__log">
              <summary>Respons create transaction</summary>
              <pre>{JSON.stringify(payment.rawCreateResponse, null, 2)}</pre>
            </details>
            <details className="console-order-detail__log">
              <summary>Callback pembayaran</summary>
              <pre>{JSON.stringify(payment.rawCallback, null, 2)}</pre>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
}
