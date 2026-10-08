"use client";

import {
  ConsoleIconButton,
  ConsoleIconEdit,
  ConsoleIconView,
} from "@/components/console/console-icon-button";

type OrderRowActionsProps = {
  orderId: string;
};

export function OrderRowActions({ orderId }: OrderRowActionsProps) {
  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <ConsoleIconButton
        href={`/console/orders/${orderId}`}
        title="Lihat detail"
        variant="default"
      >
        <ConsoleIconView />
      </ConsoleIconButton>
      <ConsoleIconButton
        href={`/console/orders/${orderId}/aksi`}
        title="Kelola pesanan"
        variant="accent"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
    </div>
  );
}
