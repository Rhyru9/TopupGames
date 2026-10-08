import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { OrderPaymentsFilters } from "@/components/console/order-payments/order-payments-filters";
import { OrderPaymentsTable } from "@/components/console/order-payments/order-payments-table";
import { parsePagination } from "@/lib/console-pagination";
import { listOrderPayments } from "@/lib/orders/list-order-payments";
import { isOrderPaymentStatus } from "@/lib/orders/order-status-labels";

type OrderPaymentsPageProps = {
  searchParams: Promise<{
    q?: string;
    paymentStatus?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function ConsoleOrderPaymentsPage({ searchParams }: OrderPaymentsPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const rawStatus = params.paymentStatus ?? "";
  const paymentStatus = isOrderPaymentStatus(rawStatus) ? rawStatus : "";
  const { page, pageSize, skip } = parsePagination(params);
  const { payments, total } = await listOrderPayments({
    q,
    paymentStatus,
    skip,
    take: pageSize,
  });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Transaksi"
        title="Pembayaran Pesanan"
        description="Data sisi pembayaran dan respons payment gateway (DOKU). Status top-up ada di menu Pesanan."
      />

      <div className="console-panel console-list-panel">
        <OrderPaymentsFilters
          values={{ q, paymentStatus: paymentStatus || undefined }}
          pageSize={pageSize}
        />
        <OrderPaymentsTable payments={payments} hasFilters={Boolean(q || paymentStatus)} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/order-payments"
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
