import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { OrderDetailHeaderActions } from "@/components/console/orders/order-detail-header-actions";
import { OrderDetailView } from "@/components/console/orders/order-detail-view";
import { getOrderAdminDetail } from "@/lib/orders/list-orders";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConsoleOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderAdminDetail(id);
  if (!order) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Pesanan"
        title={order.orderCode}
        description={`${order.productNameSnapshot} — ${order.skuNameSnapshot}`}
        backLink={{ href: "/console/orders", label: "← Kembali ke pesanan" }}
        actionsSlot={
          <OrderDetailHeaderActions orderId={order.id} orderCode={order.orderCode} />
        }
      />

      <OrderDetailView order={order} />
    </div>
  );
}
