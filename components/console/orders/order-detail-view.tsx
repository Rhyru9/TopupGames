import Link from "next/link";
import type { ReactNode } from "react";
import { formatRupiah } from "@/lib/format-rupiah";
import { playerFieldsToRecord } from "@/lib/orders/player-fields";
import { extractProviderMessage } from "@/lib/providers/fulfillment/extract-provider-message";
import {
  ORDER_FULFILLMENT_STATUS_LABEL,
  ORDER_PAYMENT_STATUS_LABEL,
  type OrderFulfillmentStatusValue,
  type OrderPaymentStatusValue,
} from "@/lib/orders/order-status-labels";
import type { getOrderAdminDetail } from "@/lib/orders/list-orders";

type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderAdminDetail>>>;

type OrderDetailViewProps = {
  order: OrderDetail;
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

function fulfillmentBadgeClass(status: string) {
  if (status === "SUCCESS") return "console-badge--success";
  if (status === "QUEUED" || status === "PROCESSING") return "console-badge--warning";
  if (status === "FAILED" || status === "CANCELLED") return "console-badge--danger";
  return "console-badge--muted";
}

function walletPaymentMethodLabel(wallet: OrderDetail["wallet"]): string | null {
  if (!wallet) return null;
  const parts: string[] = [];
  if (wallet.poinUsed > 0) parts.push(`Poin −${formatRupiah(wallet.poinUsed)}`);
  if (wallet.saldoUsed > 0) parts.push(`Saldo −${formatRupiah(wallet.saldoUsed)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function isWalletSettledPayment(order: OrderDetail): boolean {
  if (order.payments[0]) return false;
  if (order.paymentStatus !== "PAID") return false;
  const wallet = order.wallet;
  return Boolean(wallet && (wallet.saldoUsed > 0 || wallet.poinUsed > 0));
}

function Field({
  label,
  children,
  full,
  accent,
  mono,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className={`console-order-detail__field${full ? " console-order-detail__field--full" : ""}`}
    >
      <dt>{label}</dt>
      <dd
        className={[
          accent ? "console-order-detail__field-value--accent" : "",
          mono ? "console-order-detail__code" : "",
        ]
          .filter(Boolean)
          .join(" ") || undefined}
      >
        {children}
      </dd>
    </div>
  );
}

function Section({
  title,
  extra,
  children,
  className,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`console-panel console-panel--padded ${className ?? ""}`.trim()}>
      <div className="console-order-detail__section-head">
        <h2 className="console-order-detail__section-title">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const payment = order.payments[0] ?? null;
  const walletPayment = isWalletSettledPayment(order);
  const walletMethodLabel = walletPaymentMethodLabel(order.wallet);
  const payStatus = order.paymentStatus as OrderPaymentStatusValue;
  const fulfillStatus = order.fulfillmentStatus as OrderFulfillmentStatusValue;
  const playerFields = playerFieldsToRecord(order.playerFields);
  const latestLog = order.fulfillmentLogs[0] ?? null;
  const latestProviderMessage =
    order.fulfillmentMessage ||
    latestLog?.message ||
    extractProviderMessage(latestLog?.responsePayload) ||
    null;
  const queuedWithoutAttempt =
    fulfillStatus === "QUEUED" &&
    !order.fulfillmentAttemptedAt &&
    order.fulfillmentLogs.length === 0;
  const skuChanged =
    Boolean(order.productSku) &&
    (order.productSku!.name !== order.skuNameSnapshot ||
      order.productSku!.providerSku !== (order.providerSkuSnapshot ?? ""));
  const responseTone =
    fulfillStatus === "FAILED" || fulfillStatus === "CANCELLED" ? "error" : "default";

  return (
    <div className="console-order-detail">
      <div className="console-order-detail-page">
        <div className="console-order-detail__main">
          <section className="console-panel console-panel--padded console-order-detail__hero">
            <div className="console-order-detail__stats">
              <div className="console-order-detail__stat">
                <span className="console-order-detail__stat-label">Status top-up</span>
                <span className={`console-badge ${fulfillmentBadgeClass(fulfillStatus)}`}>
                  {ORDER_FULFILLMENT_STATUS_LABEL[fulfillStatus]}
                </span>
              </div>
              <div className="console-order-detail__stat">
                <span className="console-order-detail__stat-label">Total bayar</span>
                <strong className="console-order-detail__stat-value console-order-detail__stat-value--accent">
                  {formatRupiah(order.amount)}
                </strong>
              </div>
              <div className="console-order-detail__stat">
                <span className="console-order-detail__stat-label">Status bayar</span>
                <span className={`console-badge ${paymentBadgeClass(payStatus)}`}>
                  {ORDER_PAYMENT_STATUS_LABEL[payStatus]}
                </span>
              </div>
              <div className="console-order-detail__stat">
                <span className="console-order-detail__stat-label">Dibuat</span>
                <strong className="console-order-detail__stat-value">
                  {formatDateTime(order.createdAt)}
                </strong>
              </div>
            </div>
          </section>

          <Section title="Pesanan">
            <dl className="console-order-detail__fields console-order-detail__fields--rows">
              <Field label="Produk">{order.productNameSnapshot}</Field>
              <Field label="Nominal">{order.skuNameSnapshot}</Field>
              {skuChanged ? (
                <Field label="SKU dikirim">
                  {order.productSku?.name}
                  {order.providerSkuSnapshot ? ` · ${order.providerSkuSnapshot}` : ""}
                </Field>
              ) : null}
              {order.voucherDiscountSnapshot > 0 ? (
                <>
                  <Field label="Subtotal">{formatRupiah(order.itemSubtotalSnapshot)}</Field>
                  <Field label="Diskon voucher" accent>
                    −{formatRupiah(order.voucherDiscountSnapshot)}
                    {order.voucherCodeSnapshot ? ` (${order.voucherCodeSnapshot})` : ""}
                  </Field>
                </>
              ) : null}
              <Field label="Harga item">{formatRupiah(order.priceSnapshot)}</Field>
              <Field label="Biaya admin">{formatRupiah(order.feeSnapshot)}</Field>
              <Field label="Total" accent>
                {formatRupiah(order.amount)}
              </Field>
              {order.wallet && order.wallet.poinUsed > 0 ? (
                <Field label="Poin dipakai">−{formatRupiah(order.wallet.poinUsed)}</Field>
              ) : null}
              {order.wallet && order.wallet.saldoUsed > 0 ? (
                <Field label="Saldo dipakai">−{formatRupiah(order.wallet.saldoUsed)}</Field>
              ) : null}
              {order.wallet && order.wallet.cashbackPoinSnapshot > 0 ? (
                <>
                  <Field label="Cashback">
                    {order.wallet.cashbackPoinSnapshot.toLocaleString("id-ID")} poin
                  </Field>
                  <Field label="Status cashback">
                    {order.wallet.cashbackCreditedAt
                      ? `Dikredit ${formatDateTime(order.wallet.cashbackCreditedAt)}`
                      : order.memberId
                        ? "Belum dikredit"
                        : "Hanya untuk member"}
                  </Field>
                </>
              ) : null}
              <Field label="Kedaluwarsa">{formatDateTime(order.expiresAt)}</Field>
            </dl>
          </Section>

          <Section
            title="Pelanggan"
            extra={
              <span className="console-badge console-badge--muted">
                {order.member ? "Member" : "Guest"}
              </span>
            }
          >
            <dl className="console-order-detail__fields console-order-detail__fields--rows">
              <Field label="Email">{order.email || "—"}</Field>
              <Field label="WhatsApp">{order.whatsapp || "—"}</Field>
              {order.member ? (
                <>
                  <Field label="Nama">
                    <Link
                      href={`/console/members/${order.member.id}/edit`}
                      className="console-table__link"
                    >
                      {order.member.name}
                    </Link>
                  </Field>
                  <Field label="ID Member" accent>
                    {order.member.memberCode}
                  </Field>
                  <Field label="Email member">{order.member.email}</Field>
                </>
              ) : null}
              {Object.keys(playerFields).length > 0
                ? Object.entries(playerFields).map(([key, value]) => (
                    <Field key={key} label={key}>
                      {value}
                    </Field>
                  ))
                : (
                  <Field label="Akun">{order.playerLabel || "—"}</Field>
                )}
              <Field label="Nickname">{order.playerNickname || "—"}</Field>
            </dl>
          </Section>

          <Section title="Pembayaran">
            {payment ? (
              <dl className="console-order-detail__fields console-order-detail__fields--rows">
                <Field label="Gateway">{payment.provider}</Field>
                <Field label="Metode">{payment.channelName || payment.channel}</Field>
                {walletMethodLabel ? (
                  <Field label="Wallet member">{walletMethodLabel}</Field>
                ) : null}
                <Field label="Reference" mono>
                  {payment.reference}
                </Field>
                <Field label="Dibayar">{formatDateTime(payment.paidAt)}</Field>
                <Field label="Detail">
                  <Link
                    href={`/console/order-payments/${payment.id}`}
                    className="console-table__link"
                  >
                    Buka pembayaran
                  </Link>
                </Field>
              </dl>
            ) : walletPayment && walletMethodLabel ? (
              <dl className="console-order-detail__fields console-order-detail__fields--rows">
                <Field label="Gateway">Wallet member</Field>
                <Field label="Metode">{walletMethodLabel}</Field>
                <Field label="Reference" mono>
                  {order.orderCode}
                </Field>
                <Field label="Dibayar">
                  {formatDateTime(order.wallet?.walletDebitedAt ?? order.createdAt)}
                </Field>
              </dl>
            ) : payStatus === "PAID" ? (
              <p className="console-order-detail__empty">
                Lunas tanpa record gateway — cek bagian Pesanan untuk rincian wallet.
              </p>
            ) : (
              <p className="console-order-detail__empty">Belum ada data pembayaran.</p>
            )}
          </Section>
        </div>

        <aside className="console-order-detail__aside">
          <Section title="Provider">
            <dl className="console-order-detail__fields console-order-detail__fields--rows">
              <Field label="Provider">{order.providerSlug || "—"}</Field>
              <Field label="SKU" mono>
                {order.providerSkuSnapshot || "—"}
              </Field>
              <Field label="Ref" mono>
                {order.providerRefId || "—"}
              </Field>
              <Field label="SN / kode">{order.fulfillmentSn || "—"}</Field>
              <Field label="Attempted">{formatDateTime(order.fulfillmentAttemptedAt)}</Field>
              <Field label="Completed">{formatDateTime(order.fulfillmentCompletedAt)}</Field>
              {order.wallet?.walletRefundedAt ? (
                <Field label="Saldo dikredit">
                  {formatDateTime(order.wallet.walletRefundedAt)}
                </Field>
              ) : null}
            </dl>
          </Section>

          <section className="console-panel console-panel--padded">
            <div className="console-order-detail__section-head">
              <h2 className="console-order-detail__section-title">Respons terbaru</h2>
            </div>
            {queuedWithoutAttempt ? (
              <p className="console-field__hint" style={{ margin: 0 }}>
                Belum ada respons — order masih antrean. Pastikan Redis aktif dan worker
                fulfillment berjalan.
              </p>
            ) : latestProviderMessage ? (
              <>
                <p
                  className={`console-order-detail__provider-message${
                    responseTone === "error"
                      ? " console-order-detail__provider-message--error"
                      : ""
                  }`}
                >
                  {latestProviderMessage}
                </p>
                {latestLog ? (
                  <p className="console-order-detail__provider-meta">
                    Log #{latestLog.attempt} · {latestLog.action} · {latestLog.status} ·{" "}
                    {latestLog.providerSlug} · {formatDateTime(latestLog.createdAt)}
                  </p>
                ) : null}
                {latestLog?.responsePayload ? (
                  <details className="console-order-detail__log console-order-detail__payload">
                    <summary>Payload respons terakhir</summary>
                    <pre>{JSON.stringify(latestLog.responsePayload, null, 2)}</pre>
                  </details>
                ) : null}
              </>
            ) : (
              <p className="console-order-detail__empty">
                Belum ada pesan dari provider.{" "}
                <Link href={`/console/orders/${order.id}/aksi`} className="console-table__link">
                  Kelola pesanan
                </Link>{" "}
                untuk kirim ulang.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
