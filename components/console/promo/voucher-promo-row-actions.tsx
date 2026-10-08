"use client";

import { useRef } from "react";
import { deletePromoVoucher } from "@/app/console/(panel)/promo/voucher-promo/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import {
  ConsoleIconButton,
  ConsoleIconEdit,
  ConsoleIconTrash,
} from "@/components/console/console-icon-button";

type VoucherPromoRowActionsProps = {
  voucherId: string;
  code: string;
};

export function VoucherPromoRowActions({ voucherId, code }: VoucherPromoRowActionsProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <ConsoleIconButton
        href={`/console/promo/voucher-promo/${voucherId}/edit`}
        title="Edit voucher"
        variant="default"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <form
        action={deletePromoVoucher}
        className="console-table-action"
        onSubmit={async (event) => {
          if (skipConfirmRef.current) return;
          event.preventDefault();
          const confirmed = await confirm({
            title: "Hapus voucher?",
            description: `Kode "${code}" akan dihapus permanen.`,
            confirmLabel: "Hapus",
            variant: "danger",
          });
          if (!confirmed) return;
          skipConfirmRef.current = true;
          event.currentTarget.requestSubmit();
        }}
      >
        <input type="hidden" name="voucherId" value={voucherId} />
        <ConsoleIconButton type="submit" title="Hapus voucher" variant="danger">
          <ConsoleIconTrash />
        </ConsoleIconButton>
      </form>
    </div>
  );
}
