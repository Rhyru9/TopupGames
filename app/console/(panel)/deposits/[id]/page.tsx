import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { formatRupiah } from "@/lib/format-rupiah";
import { getAdminDepositDetail } from "@/lib/member/list-admin-deposits";
import { findLedgerEntryByDepositCode } from "@/lib/member/member-ledger";
import {
  ORDER_PAYMENT_STATUS_LABEL,
  type OrderPaymentStatusValue,
} from "@/lib/orders/order-status-labels";

type DepositDetailPageProps = {
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

export default async function ConsoleDepositDetailPage({ params }: DepositDetailPageProps) {
  const { id } = await params;
  const deposit = await getAdminDepositDetail(id);
  if (!deposit) notFound();

  const payment = deposit.payments[0] ?? null;
  const payStatus = deposit.paymentStatus as OrderPaymentStatusValue;
  const ledgerEntry =
    payStatus === "PAID"
      ? await findLedgerEntryByDepositCode({
          memberId: deposit.memberId,
          depositCode: deposit.depositCode,
        })
      : null;

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Deposit Member"
        title={deposit.depositCode}
        description={`Topup saldo — ${deposit.member.name}`}
        backLink={{ href: "/console/deposits", label: "← Kembali ke deposit" }}
      />

      <div className="console-order-detail">
        <section className="console-panel console-panel--padded">
          <div className="console-order-detail__stats">
            <div className="console-order-detail__stat">
              <span className="console-order-detail__stat-label">Kredit saldo</span>
              <strong className="console-order-detail__stat-value console-order-detail__stat-value--accent">
                {formatRupiah(deposit.amount)}
              </strong>
            </div>
            <div className="console-order-detail__stat">
              <span className="console-order-detail__stat-label">Total bayar</span>
              <strong className="console-order-detail__stat-value">
                {formatRupiah(deposit.totalAmount)}
              </strong>
            </div>
            <div className="console-order-detail__stat">
              <span className="console-order-detail__stat-label">Status</span>
              <span className={`console-badge ${paymentBadgeClass(payStatus)}`}>
                {ORDER_PAYMENT_STATUS_LABEL[payStatus]}
              </span>
            </div>
            <div className="console-order-detail__stat">
              <span className="console-order-detail__stat-label">Dibuat</span>
              <strong className="console-order-detail__stat-value">
                {formatDateTime(deposit.createdAt)}
              </strong>
            </div>
          </div>
        </section>

        <div className="console-order-detail__grid">
          <section className="console-panel console-panel--padded">
            <h2 className="console-order-detail__section-title">Deposit</h2>
            <dl className="console-order-detail__fields">
              <div className="console-order-detail__field">
                <dt>Kode</dt>
                <dd>{deposit.depositCode}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Kredit saldo</dt>
                <dd>{formatRupiah(deposit.amount)}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Biaya admin</dt>
                <dd>{formatRupiah(deposit.feeSnapshot)}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Total bayar</dt>
                <dd>{formatRupiah(deposit.totalAmount)}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Kadaluarsa</dt>
                <dd>{formatDateTime(deposit.expiresAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="console-panel console-panel--padded">
            <h2 className="console-order-detail__section-title">Member</h2>
            <dl className="console-order-detail__fields">
              <div className="console-order-detail__field">
                <dt>Nama</dt>
                <dd>
                  <Link
                    href={`/console/members/${deposit.member.id}/edit`}
                    className="console-table__link"
                  >
                    {deposit.member.name}
                  </Link>
                </dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Email</dt>
                <dd>{deposit.member.email}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>WhatsApp</dt>
                <dd>{deposit.member.whatsapp || "—"}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Saldo saat ini</dt>
                <dd>{formatRupiah(deposit.member.balance?.saldo ?? 0)}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Poin</dt>
                <dd>{(deposit.member.balance?.poin ?? 0).toLocaleString("id-ID")}</dd>
              </div>
              <div className="console-order-detail__field">
                <dt>Mutasi member</dt>
                <dd>
                  <Link
                    href={`/console/members/balances/${deposit.member.id}`}
                    className="console-table__link"
                  >
                    Lihat semua mutasi
                  </Link>
                </dd>
              </div>
            </dl>
          </section>

          <section className="console-panel console-panel--padded">
            <h2 className="console-order-detail__section-title">Pembayaran</h2>
            {payment ? (
              <dl className="console-order-detail__fields">
                <div className="console-order-detail__field">
                  <dt>Provider</dt>
                  <dd>{payment.provider}</dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Metode</dt>
                  <dd>{payment.channelName || payment.channel}</dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Reference</dt>
                  <dd>{payment.reference}</dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Amount DOKU</dt>
                  <dd>{formatRupiah(payment.amount)}</dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Status payment</dt>
                  <dd>
                    <span className={`console-badge ${paymentBadgeClass(payment.status)}`}>
                      {
                        ORDER_PAYMENT_STATUS_LABEL[
                          payment.status as OrderPaymentStatusValue
                        ]
                      }
                    </span>
                  </dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Paid at</dt>
                  <dd>{formatDateTime(payment.paidAt)}</dd>
                </div>
                {payment.payCode ? (
                  <div className="console-order-detail__field">
                    <dt>Kode bayar / VA</dt>
                    <dd>{payment.payCode}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="console-table__muted">Belum ada data pembayaran.</p>
            )}
          </section>

          <section className="console-panel console-panel--padded">
            <h2 className="console-order-detail__section-title">Mutasi saldo</h2>
            {ledgerEntry ? (
              <dl className="console-order-detail__fields">
                <div className="console-order-detail__field">
                  <dt>Saldo sebelum</dt>
                  <dd>{formatRupiah(ledgerEntry.balanceBefore)}</dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Kredit</dt>
                  <dd>+{formatRupiah(ledgerEntry.amount)}</dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Saldo sesudah</dt>
                  <dd>{formatRupiah(ledgerEntry.balanceAfter)}</dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Waktu mutasi</dt>
                  <dd>{formatDateTime(ledgerEntry.createdAt)}</dd>
                </div>
                <div className="console-order-detail__field">
                  <dt>Keterangan</dt>
                  <dd>{ledgerEntry.reason}</dd>
                </div>
              </dl>
            ) : payStatus === "PAID" ? (
              <p className="console-table__muted">
                Deposit lunas, tetapi entry mutasi belum ditemukan. Cek halaman mutasi member.
              </p>
            ) : (
              <p className="console-table__muted">
                Mutasi saldo muncul setelah pembayaran lunas dan dikredit otomatis.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
