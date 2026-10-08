import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { OrdersFilters } from "@/components/console/orders/orders-filters";
import { OrdersTable } from "@/components/console/orders/orders-table";
import { parsePagination } from "@/lib/console-pagination";
import { listOrders } from "@/lib/orders/list-orders";
import {
  isOrderFulfillmentStatus,
  isOrderPaymentStatus,
} from "@/lib/orders/order-status-labels";

type OrdersPageProps = {
  searchParams: Promise<{
    q?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function ConsoleOrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const rawPay = params.paymentStatus ?? "";
  const rawFulfill = params.fulfillmentStatus ?? "";
  const paymentStatus = isOrderPaymentStatus(rawPay) ? rawPay : "";
  const fulfillmentStatus = isOrderFulfillmentStatus(rawFulfill) ? rawFulfill : "";
  const { page, pageSize, skip } = parsePagination(params);
  const { orders, total } = await listOrders({
    q,
    paymentStatus,
    fulfillmentStatus,
    skip,
    take: pageSize,
  });

  const hasFilters = Boolean(q || paymentStatus || fulfillmentStatus);

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Transaksi"
        title="Pesanan"
        description="Kelola pesanan toko. Detail gateway ada di Pembayaran Pesanan."
      />

      <div className="console-panel console-list-panel">
        <OrdersFilters
          values={{
            q,
            paymentStatus: paymentStatus || undefined,
            fulfillmentStatus: fulfillmentStatus || undefined,
          }}
          pageSize={pageSize}
        />
        <OrdersTable orders={orders} hasFilters={hasFilters} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/orders"
          query={{
            q,
            paymentStatus: paymentStatus || undefined,
            fulfillmentStatus: fulfillmentStatus || undefined,
            pageSize: params.pageSize,
          }}
        />
      </div>
    </div>
  );
}
