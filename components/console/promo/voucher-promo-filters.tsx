"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ConsoleListToolbar } from "@/components/console/console-list-toolbar";
import { buildConsoleQuery } from "@/lib/console-pagination";

type VoucherPromoFiltersProps = {
  values: { q?: string };
  pageSize?: number;
};

const SEARCH_DEBOUNCE_MS = 350;

export function VoucherPromoFilters({ values, pageSize }: VoucherPromoFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [q, setQ] = useState(values.q ?? "");

  useEffect(() => {
    setQ(values.q ?? "");
  }, [values.q]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function navigate(nextQ?: string) {
    startTransition(() => {
      router.push(
        `/console/promo/voucher-promo${buildConsoleQuery({
          q: nextQ?.trim() || undefined,
          pageSize: pageSize ? String(pageSize) : undefined,
        })}`,
      );
    });
  }

  return (
    <ConsoleListToolbar
      pending={isPending}
      searchPlaceholder="Cari kode atau label…"
      searchAriaLabel="Cari voucher"
      searchValue={q}
      onSearchChange={(value) => {
        setQ(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => navigate(value), SEARCH_DEBOUNCE_MS);
      }}
    />
  );
}
