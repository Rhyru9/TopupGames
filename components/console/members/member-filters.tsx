"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ConsoleListToolbar } from "@/components/console/console-list-toolbar";
import { buildConsoleQuery } from "@/lib/console-pagination";
import { MEMBER_STATUS_LABEL, MEMBER_STATUSES } from "@/lib/member/member-status";

export type MemberFilterValues = {
  q?: string;
  status?: string;
};

type MemberFiltersProps = {
  values: MemberFilterValues;
  pageSize?: number;
};

const SEARCH_DEBOUNCE_MS = 350;

export function MemberFilters({ values, pageSize }: MemberFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [q, setQ] = useState(values.q ?? "");
  const [draftStatus, setDraftStatus] = useState(values.status ?? "");

  useEffect(() => {
    setQ(values.q ?? "");
    setDraftStatus(values.status ?? "");
  }, [values.q, values.status]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function navigate(next: MemberFilterValues) {
    startTransition(() => {
      router.push(
        `/console/members${buildConsoleQuery({
          q: (next.q ?? q)?.trim() || undefined,
          status:
            next.status !== undefined
              ? next.status || undefined
              : values.status || undefined,
          pageSize: pageSize ? String(pageSize) : undefined,
        })}`,
      );
    });
  }

  const statusValue = values.status ?? "";

  return (
    <ConsoleListToolbar
      pending={isPending}
      searchPlaceholder="Cari ID (CUS…), nama, email, atau WhatsApp…"
      searchAriaLabel="Cari member"
      searchValue={q}
      onSearchChange={(value) => {
        setQ(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          navigate({ q: value });
        }, SEARCH_DEBOUNCE_MS);
      }}
      filterActive={Boolean(values.status)}
      mobileTitle="Status member"
      desktopFilters={
        <select
          value={statusValue}
          onChange={(e) => navigate({ status: e.target.value })}
          className="console-input console-list-filter-bar__select"
          aria-label="Filter status"
        >
          <option value="">Semua status</option>
          {MEMBER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {MEMBER_STATUS_LABEL[value]}
            </option>
          ))}
          <option value="inactive">Nonaktif (suspend + ban)</option>
        </select>
      }
      mobileFilterFields={
        <label className="console-report-filter-bar__field">
          <span>Status</span>
          <select
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
            className="console-input"
          >
            <option value="">Semua</option>
            {MEMBER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {MEMBER_STATUS_LABEL[value]}
              </option>
            ))}
            <option value="inactive">Nonaktif (suspend + ban)</option>
          </select>
        </label>
      }
      onMobileApply={() => navigate({ status: draftStatus })}
      onMobileReset={() => {
        setDraftStatus("");
        navigate({ status: "" });
      }}
    />
  );
}
