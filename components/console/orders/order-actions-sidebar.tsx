import Link from "next/link";
import { extractProviderMessage } from "@/lib/providers/fulfillment/extract-provider-message";
import {
  ORDER_FULFILLMENT_STATUS_LABEL,
  type OrderFulfillmentStatusValue,
} from "@/lib/orders/order-status-labels";
import { formatRupiah } from "@/lib/format-rupiah";
import type { getOrderAdminDetail } from "@/lib/orders/list-orders";

type OrderActionsSidebarProps = {
  order: NonNullable<Awaited<ReturnType<typeof getOrderAdminDetail>>>;
};

function fulfillmentBadgeClass(status: string) {
  if (status === "SUCCESS") return "console-badge--success";
  if (status === "QUEUED" || status === "PROCESSING") return "console-badge--warning";
  if (status === "FAILED" || status === "CANCELLED") return "console-badge--danger";
  return "console-badge--muted";
}

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

export function OrderActionsSidebar({ order }: OrderActionsSidebarProps) {
  const fulfillStatus = order.fulfillmentStatus as OrderFulfillmentStatusValue;
  const latestLog = order.fulfillmentLogs[0] ?? null;
  const providerMessage =
    order.fulfillmentMessage?.trim() ||
    latestLog?.message?.trim() ||
    extractProviderMessage(latestLog?.responsePayload) ||
    null;
  const queuedWithoutAttempt =
    fulfillStatus === "QUEUED" &&
    !order.fulfillmentAttemptedAt &&
    order.fulfillmentLogs.length === 0;

  return (
    <aside className="console-order-actions__aside">
      <section className="console-panel console-panel--padded console-order-actions__snapshot">
        <div className="console-order-actions__snapshot-head">
          <h2 className="console-order-actions__snapshot-title">Ringkasan</h2>
          <span className={`console-badge ${fulfillmentBadgeClass(fulfillStatus)}`}>
            {ORDER_FULFILLMENT_STATUS_LABEL[fulfillStatus]}
          </span>
        </div>

        <dl className="console-order-actions__snapshot-grid">
          <div>
            <dt>Total bayar</dt>
            <dd className="console-order-actions__snapshot-accent">
              {formatRupiah(order.amount)}
            </dd>
          </div>
          <div>
            <dt>Nominal</dt>
            <dd>{order.skuNameSnapshot}</dd>
          </div>
          <div className="console-order-actions__snapshot-span">
            <dt>Pelanggan</dt>
            <dd>
              {order.member ? (
                <>
                  {order.member.name}
                  <span className="console-order-actions__snapshot-muted">
                    {" "}
                    · {order.member.memberCode}
                  </span>
                </>
              ) : (
                order.email || order.whatsapp || "Guest"
              )}
            </dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{order.providerSlug || "—"}</dd>
          </div>
          <div>
            <dt>SKU provider</dt>
            <dd>
              <code className="console-order-detail__code">
                {order.providerSkuSnapshot || "—"}
              </code>
            </dd>
          </div>
          <div>
            <dt>Provider ref</dt>
            <dd>
              <code className="console-order-detail__code">
                {order.providerRefId || "—"}
              </code>
            </dd>
          </div>
          <div>
            <dt>SN / kode</dt>
            <dd>{order.fulfillmentSn || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="console-panel console-panel--padded console-order-actions__provider">
        <h2 className="console-order-actions__provider-title">Respons provider</h2>
        {queuedWithoutAttempt ? (
          <p className="console-field__hint" style={{ margin: 0 }}>
            Belum ada respons — order masih antrean. Pastikan worker fulfillment berjalan.
          </p>
        ) : providerMessage ? (
          <>
            <p
              className={`console-order-actions__provider-message${
                fulfillStatus === "FAILED" || fulfillStatus === "CANCELLED"
                  ? " console-order-actions__provider-message--error"
                  : ""
              }`}
            >
              {providerMessage}
            </p>
            {latestLog ? (
              <p className="console-order-actions__provider-meta">
                Log #{latestLog.attempt} · {latestLog.action} · {latestLog.status} ·{" "}
                {formatDateTime(latestLog.createdAt)}
              </p>
            ) : null}
            {latestLog?.responsePayload ? (
              <details className="console-order-detail__log console-order-actions__provider-payload">
                <summary>Payload respons terakhir</summary>
                <pre>{JSON.stringify(latestLog.responsePayload, null, 2)}</pre>
              </details>
            ) : null}
          </>
        ) : (
          <p className="console-field__hint" style={{ margin: 0 }}>
            Belum ada pesan dari provider.
          </p>
        )}
        <p className="console-order-actions__provider-foot">
          <Link href={`/console/orders/${order.id}`} className="console-table__link">
            Lihat detail pesanan →
          </Link>
        </p>
      </section>
    </aside>
  );
}
