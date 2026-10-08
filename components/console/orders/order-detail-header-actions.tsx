import Link from "next/link";

type OrderDetailHeaderActionsProps = {
  orderId: string;
  orderCode: string;
};

export function OrderDetailHeaderActions({
  orderId,
  orderCode,
}: OrderDetailHeaderActionsProps) {
  return (
    <div className="console-order-detail__header-actions">
      <Link
        href={`/invoice/${orderCode}`}
        className="console-btn-secondary console-order-detail__header-btn"
        target="_blank"
        rel="noreferrer"
      >
        Invoice
      </Link>
      <Link
        href={`/console/orders/${orderId}/aksi`}
        className="console-btn-primary console-order-detail__header-btn"
      >
        Kelola
      </Link>
    </div>
  );
}
