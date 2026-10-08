"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ConsoleListToolbar } from "@/components/console/console-list-toolbar";
import { buildConsoleQuery } from "@/lib/console-pagination";
import {
  ORDER_FULFILLMENT_STATUS_LABEL,
  ORDER_FULFILLMENT_STATUSES,
  ORDER_PAYMENT_STATUS_LABEL,
  ORDER_PAYMENT_STATUSES,
} from "@/lib/orders/order-status-labels";

type OrdersFiltersProps = {
  values: {
    q?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
  };
  pageSize?: number;
};

const SEARCH_DEBOUNCE_MS = 350;

export function OrdersFilters({ values, pageSize }: OrdersFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [q, setQ] = useState(values.q ?? "");
  const [draftPay, setDraftPay] = useState(values.paymentStatus ?? "");
  const [draftFulfill, setDraftFulfill] = useState(values.fulfillmentStatus ?? "");

  useEffect(() => {
    setQ(values.q ?? "");
    setDraftPay(values.paymentStatus ?? "");
    setDraftFulfill(values.fulfillmentStatus ?? "");
  }, [values.q, values.paymentStatus, values.fulfillmentStatus]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function navigate(next: {
    q?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
  }) {
    startTransition(() => {
      router.push(
        `/console/orders${buildConsoleQuery({
          q: (next.q ?? q)?.trim() || undefined,
          paymentStatus:
            next.paymentStatus !== undefined
              ? next.paymentStatus || undefined
              : values.paymentStatus || undefined,
          fulfillmentStatus:
            next.fulfillmentStatus !== undefined
              ? next.fulfillmentStatus || undefined
              : values.fulfillmentStatus || undefined,
          pageSize: pageSize ? String(pageSize) : undefined,
        })}`,
      );
    });
  }

  const paymentValue = values.paymentStatus ?? "";
  const fulfillValue = values.fulfillmentStatus ?? "";

  return (
    <ConsoleListToolbar
      pending={isPending}
      searchPlaceholder="Cari kode, player, produk…"
      searchAriaLabel="Cari pesanan"
      searchValue={q}
      onSearchChange={(value) => {
        setQ(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          navigate({ q: value });
        }, SEARCH_DEBOUNCE_MS);
      }}
      filterActive={Boolean(values.paymentStatus || values.fulfillmentStatus)}
      mobileTitle="Status pesanan"
      desktopFilters={
        <>
          <select
            value={paymentValue}
            onChange={(e) => navigate({ paymentStatus: e.target.value })}
            className="console-input console-list-filter-bar__select"
            aria-label="Filter status bayar"
          >
            <option value="">Semua bayar</option>
            {ORDER_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_PAYMENT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <select
            value={fulfillValue}
            onChange={(e) => navigate({ fulfillmentStatus: e.target.value })}
            className="console-input console-list-filter-bar__select"
            aria-label="Filter status top-up"
          >
            <option value="">Semua top-up</option>
            {ORDER_FULFILLMENT_STATUSES.filter((s) => s !== "NONE").map((status) => (
              <option key={status} value={status}>
                {ORDER_FULFILLMENT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </>
      }
      mobileFilterFields={
        <>
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
          <label className="console-report-filter-bar__field">
            <span>Status top-up</span>
            <select
              value={draftFulfill}
              onChange={(e) => setDraftFulfill(e.target.value)}
              className="console-input"
            >
              <option value="">Semua</option>
              {ORDER_FULFILLMENT_STATUSES.filter((s) => s !== "NONE").map((status) => (
                <option key={status} value={status}>
                  {ORDER_FULFILLMENT_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
        </>
      }
      onMobileApply={() =>
        navigate({
          paymentStatus: draftPay,
          fulfillmentStatus: draftFulfill,
        })
      }
      onMobileReset={() => {
        setDraftPay("");
        setDraftFulfill("");
        navigate({ paymentStatus: "", fulfillmentStatus: "" });
      }}
    />
  );
}
