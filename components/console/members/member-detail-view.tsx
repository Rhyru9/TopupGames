import Link from "next/link";
import type { ReactNode } from "react";
import { formatRupiah } from "@/lib/format-rupiah";
import type { MemberAdminDetail } from "@/lib/member/get-member-admin-detail";
import {
  MEMBER_STATUS_LABEL,
  memberStatusBadgeClass,
  type MemberStatusValue,
} from "@/lib/member/member-status";
import {
  ORDER_FULFILLMENT_STATUS_LABEL,
  ORDER_PAYMENT_STATUS_LABEL,
} from "@/lib/orders/order-status-labels";

type MemberDetailViewProps = {
  member: MemberAdminDetail;
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

function loginLabels(member: MemberAdminDetail) {
  const labels: string[] = [];
  if (member.hasGoogle) labels.push("Google");
  if (member.hasPassword) labels.push("Email & password");
  return labels.length > 0 ? labels.join(" · ") : "—";
}

function DetailField({
  label,
  children,
  full,
  mono,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`console-member-detail-page__field${full ? " console-member-detail-page__field--full" : ""}`}>
      <dt>{label}</dt>
      <dd className={mono ? "console-member-detail-page__mono" : undefined}>{children}</dd>
    </div>
  );
}

export function MemberDetailView({ member }: MemberDetailViewProps) {
  const initial = (member.name.trim().charAt(0) || "M").toUpperCase();

  return (
    <div className="console-member-detail-page">
      <section className="console-panel console-panel--padded console-member-detail-page__hero">
        <div className="console-member-detail-page__profile">
          <div className="console-table__thumb console-table__thumb--round console-member-detail-page__avatar">
            {member.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.image}
                alt=""
                className="console-table__thumb-img"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="console-table__thumb-fallback" aria-hidden>
                {initial}
              </span>
            )}
          </div>
          <div className="console-member-detail-page__profile-copy">
            <p className="console-member-detail-page__code">{member.memberCode}</p>
            <h2 className="console-member-detail-page__name">{member.name}</h2>
            <span className={`console-badge ${memberStatusBadgeClass(member.status)}`}>
              {MEMBER_STATUS_LABEL[member.status as MemberStatusValue]}
            </span>
          </div>
        </div>

        <div className="console-member-detail-page__stats">
          <div className="console-provider-stat">
            <span className="console-provider-stat__label">Saldo</span>
            <strong>{formatRupiah(member.saldo)}</strong>
          </div>
          <div className="console-provider-stat">
            <span className="console-provider-stat__label">Poin</span>
            <strong>{member.poin.toLocaleString("id-ID")}</strong>
          </div>
          <div className="console-provider-stat">
            <span className="console-provider-stat__label">Total pesanan</span>
            <strong>{member.orderCount.toLocaleString("id-ID")}</strong>
          </div>
          <div className="console-provider-stat">
            <span className="console-provider-stat__label">Deposit</span>
            <strong>{member.depositCount.toLocaleString("id-ID")}</strong>
          </div>
        </div>
      </section>

      <div className="console-member-detail-page__grid">
        <section className="console-panel console-panel--padded">
          <h3 className="console-member-detail-page__section-title">Kontak &amp; akun</h3>
          <dl className="console-member-detail-page__fields">
            <DetailField label="Email">{member.email}</DetailField>
            <DetailField label="WhatsApp">{member.whatsapp?.trim() || "—"}</DetailField>
            <DetailField label="Metode login">{loginLabels(member)}</DetailField>
            <DetailField label="Verifikasi email">
              {member.emailVerified ? formatDateTime(member.emailVerified) : "Belum terverifikasi"}
            </DetailField>
            <DetailField label="Terdaftar">{formatDateTime(member.createdAt)}</DetailField>
            <DetailField label="Terakhir login">{formatDateTime(member.lastLoginAt)}</DetailField>
          </dl>
        </section>

        <section className="console-panel console-panel--padded">
          <h3 className="console-member-detail-page__section-title">Keamanan</h3>
          <dl className="console-member-detail-page__fields">
            <DetailField label="Status akun">
              {MEMBER_STATUS_LABEL[member.status as MemberStatusValue]}
            </DetailField>
            <DetailField label="Status diperbarui">{formatDateTime(member.statusAt)}</DetailField>
            <DetailField label="Diperbarui">{formatDateTime(member.updatedAt)}</DetailField>
            {member.statusReason ? (
              <DetailField label="Alasan status" full>
                {member.statusReason}
              </DetailField>
            ) : null}
          </dl>

          <div className="console-member-detail-page__links">
            <Link href={`/console/members/balances/${member.id}`} className="console-member-detail__link">
              Kelola saldo &amp; poin →
            </Link>
          </div>
        </section>
      </div>

      <section className="console-panel">
        <div className="console-panel__head console-panel--padded">
          <h3 className="console-member-detail-page__section-title">Pesanan terbaru</h3>
        </div>

        {member.recentOrders.length === 0 ? (
          <div className="console-empty console-empty--compact">
            <p className="console-empty__text">Belum ada pesanan dari member ini.</p>
          </div>
        ) : (
          <div className="console-table-wrap">
            <table className="console-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Produk</th>
                  <th>Total</th>
                  <th>Pembayaran</th>
                  <th>Fulfillment</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {member.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/console/orders/${order.id}`} className="console-table__link">
                        {order.orderCode}
                      </Link>
                    </td>
                    <td>{order.productNameSnapshot}</td>
                    <td>{formatRupiah(order.amount)}</td>
                    <td>
                      {ORDER_PAYMENT_STATUS_LABEL[
                        order.paymentStatus as keyof typeof ORDER_PAYMENT_STATUS_LABEL
                      ] ?? order.paymentStatus}
                    </td>
                    <td>
                      {ORDER_FULFILLMENT_STATUS_LABEL[
                        order.fulfillmentStatus as keyof typeof ORDER_FULFILLMENT_STATUS_LABEL
                      ] ?? order.fulfillmentStatus}
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
