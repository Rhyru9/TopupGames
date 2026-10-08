import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { DepositsFilters } from "@/components/console/deposits/deposits-filters";
import { DepositsTable } from "@/components/console/deposits/deposits-table";
import { parsePagination } from "@/lib/console-pagination";
import { listAdminDeposits } from "@/lib/member/list-admin-deposits";
import { isOrderPaymentStatus } from "@/lib/orders/order-status-labels";

type DepositsPageProps = {
  searchParams: Promise<{ q?: string; paymentStatus?: string; page?: string; pageSize?: string }>;
};

export default async function ConsoleDepositsPage({ searchParams }: DepositsPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const rawStatus = params.paymentStatus ?? "";
  const paymentStatus = isOrderPaymentStatus(rawStatus) ? rawStatus : "";
  const { page, pageSize, skip } = parsePagination(params);
  const { deposits, total } = await listAdminDeposits({
    q,
    paymentStatus,
    skip,
    take: pageSize,
  });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Transaksi"
        title="Deposit Member"
        description="Riwayat topup saldo member via DOKU. Saldo dikredit otomatis setelah pembayaran lunas."
      />

      <div className="console-panel console-list-panel">
        <DepositsFilters
          values={{ q, paymentStatus: paymentStatus || undefined }}
          pageSize={pageSize}
        />
        <DepositsTable deposits={deposits} hasFilters={Boolean(q || paymentStatus)} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/deposits"
          query={{
            q,
            paymentStatus: paymentStatus || undefined,
            pageSize: params.pageSize,
          }}
        />
      </div>
    </div>
  );
}
