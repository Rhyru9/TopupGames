"use client";

import Link from "next/link";
import { useConsoleToast } from "@/components/console/console-toast-provider";

type FlashSaleAddButtonProps = {
  /** Pesan toast jika create diblokir; null = boleh menambah. */
  blockedMessage?: string | null;
  className?: string;
  label?: string;
};

export function FlashSaleAddButton({
  blockedMessage = null,
  className = "console-btn-primary console-page-header__action",
  label = "+ Tambah Flash Sale",
}: FlashSaleAddButtonProps) {
  const { showToast } = useConsoleToast();

  if (!blockedMessage) {
    return (
      <Link href="/console/promo/flash-sale/new" className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => showToast(blockedMessage, "error")}
    >
      {label}
    </button>
  );
}
