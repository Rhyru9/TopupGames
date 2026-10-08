import { ConsolePageHeader } from "@/components/console/console-page-header";
import { OrderActionsGuide } from "@/components/console/orders/order-actions-guide";
import { OrderActionsSidebar } from "@/components/console/orders/order-actions-sidebar";
import { OrderFulfillmentActions } from "@/components/console/orders/order-fulfillment-actions";
import {
  getOrderAdminDetail,
  listRetryNominalOptions,
} from "@/lib/orders/list-orders";
import { notFound } from "next/navigation";

type OrderActionsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConsoleOrderActionsPage({ params }: OrderActionsPageProps) {
  const { id } = await params;
  const order = await getOrderAdminDetail(id);
  if (!order) notFound();

  const nominalOptions = await listRetryNominalOptions(order.productId);

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Kelola pesanan"
        title={order.orderCode}
        description={`${order.productNameSnapshot} — ${order.skuNameSnapshot}`}
        backLink={{
          href: `/console/orders/${order.id}`,
          label: "← Kembali ke detail",
        }}
      />

      <div className="console-order-actions-page">
        <OrderActionsSidebar order={order} />

        <div className="console-order-actions__main">
          <OrderActionsGuide
            fulfillmentStatus={order.fulfillmentStatus}
            paymentStatus={order.paymentStatus}
          />

          <OrderFulfillmentActions
            orderId={order.id}
            orderCode={order.orderCode}
            amount={order.amount}
            paymentStatus={order.paymentStatus}
            fulfillmentStatus={order.fulfillmentStatus}
            providerSlug={order.providerSlug}
            productSkuId={order.productSkuId}
            checkoutSkuName={order.skuNameSnapshot}
            sentSkuName={order.productSku?.name ?? null}
            nominalOptions={nominalOptions}
            hasMember={Boolean(order.memberId)}
          />
        </div>
      </div>
    </div>
  );
}
