"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ConsoleListToolbar } from "@/components/console/console-list-toolbar";
import { buildConsoleQuery } from "@/lib/console-pagination";
import {
  ORDER_PAYMENT_STATUS_LABEL,
  ORDER_PAYMENT_STATUSES,
} from "@/lib/orders/order-status-labels";

type OrderPaymentsFiltersProps = {
  values: { q?: string; paymentStatus?: string };
  pageSize?: number;
};

const SEARCH_DEBOUNCE_MS = 350;

export function OrderPaymentsFilters({ values, pageSize }: OrderPaymentsFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [q, setQ] = useState(values.q ?? "");
  const [draftPay, setDraftPay] = useState(values.paymentStatus ?? "");

  useEffect(() => {
    setQ(values.q ?? "");
    setDraftPay(values.paymentStatus ?? "");
  }, [values.q, values.paymentStatus]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function navigate(next: { q?: string; paymentStatus?: string }) {
    startTransition(() => {
      router.push(
        `/console/order-payments${buildConsoleQuery({
          q: (next.q ?? q)?.trim() || undefined,
          paymentStatus:
            next.paymentStatus !== undefined
              ? next.paymentStatus || undefined
              : values.paymentStatus || undefined,
          pageSize: pageSize ? String(pageSize) : undefined,
        })}`,
      );
    });
  }

  const paymentValue = values.paymentStatus ?? "";

  return (
    <ConsoleListToolbar
      pending={isPending}
      searchPlaceholder="Cari kode order, reference, channel…"
      searchAriaLabel="Cari pembayaran pesanan"
      searchValue={q}
      onSearchChange={(value) => {
        setQ(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          navigate({ q: value });
        }, SEARCH_DEBOUNCE_MS);
      }}
      filterActive={Boolean(values.paymentStatus)}
      mobileTitle="Status bayar"
      desktopFilters={
        <select
          value={paymentValue}
          onChange={(e) => navigate({ paymentStatus: e.target.value })}
          className="console-input console-list-filter-bar__select"
          aria-label="Filter status bayar"
        >
          <option value="">Semua status bayar</option>
          {ORDER_PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_PAYMENT_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      }
      mobileFilterFields={
        <label className="console-report-filter-bar__field">
          <span>Status bayar</span>
          <select
            value={draftPay}
            onChange={(e) => setDraftPay(e.target.value)}
            className="console-input"
          >
            <option value="">Semua</option>
            {ORDER_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_PAYMENT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>
      }
      onMobileApply={() => navigate({ paymentStatus: draftPay })}
      onMobileReset={() => {
        setDraftPay("");
        navigate({ paymentStatus: "" });
      }}
    />
  );
}
