"use client";

import {
  linkOrderToMember,
  lookupMembersForOrderLink,
} from "@/app/console/(panel)/orders/actions";
import type { MemberLinkSearchResult } from "@/lib/member/search-members-for-link";
import { formatRupiah } from "@/lib/format-rupiah";
import { useEffect, useId, useRef, useState } from "react";

const SEARCH_DEBOUNCE_MS = 350;

type OrderActionLinkMemberProps = {
  orderId: string;
  step: number;
};

export function OrderActionLinkMember({ orderId, step }: OrderActionLinkMemberProps) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberLinkSearchResult | null>(null);
  const [results, setResults] = useState<MemberLinkSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const query = memberQuery.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const requestId = ++requestRef.current;
      setLoading(true);
      lookupMembersForOrderLink(query)
        .then((rows) => {
          if (requestId !== requestRef.current) return;
          setResults(rows);
          setActiveIndex(rows.length > 0 ? 0 : -1);
        })
        .catch(() => {
          if (requestId !== requestRef.current) return;
          setResults([]);
          setActiveIndex(-1);
        })
        .finally(() => {
          if (requestId === requestRef.current) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
  }, [memberQuery, open]);

  function selectMember(member: MemberLinkSearchResult) {
    setSelectedMember(member);
    setMemberQuery(member.memberCode);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function openPicker() {
    setOpen(true);
    if (selectedMember) {
      setMemberQuery("");
      setResults([]);
    }
  }

  const showResults = open && memberQuery.trim().length >= 2;

  return (
    <section className="console-order-actions__step console-panel console-panel--padded">
      <div className="console-order-actions__step-head">
        <span className="console-order-actions__step-num">{step}</span>
        <h2 className="console-order-actions__step-title">Kaitkan ke member</h2>
      </div>
      <p className="console-field__hint">
        Cari ID Member (CUS…) di dropdown, lalu pilih untuk memastikan datanya benar.
      </p>
      <form action={linkOrderToMember} className="console-provider-form-stack">
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="memberId" value={selectedMember?.id ?? ""} />
        <input type="hidden" name="memberQuery" value={selectedMember?.memberCode ?? memberQuery} />

        <div className="console-field">
          <label htmlFor={inputId} className="console-field__label">
            Member
          </label>
          <div ref={rootRef} className="console-member-link-picker">
            <button
              type="button"
              id={inputId}
              className="console-member-link-picker__trigger"
              aria-expanded={open}
              aria-controls={listId}
              aria-haspopup="listbox"
              onClick={() => (open ? setOpen(false) : openPicker())}
            >
              {selectedMember ? (
                <span className="console-member-link-picker__trigger-value">
                  <span className="console-member-link-picker__option-code">
                    {selectedMember.memberCode}
                  </span>
                  <span className="console-member-link-picker__trigger-name">
                    {selectedMember.name}
                  </span>
                  <span className="console-member-link-picker__trigger-saldo">
                    {formatRupiah(selectedMember.saldo)}
                  </span>
                </span>
              ) : (
                <span className="console-member-link-picker__trigger-placeholder">
                  Pilih member…
                </span>
              )}
              <span className="console-member-link-picker__chevron" aria-hidden>
                {open ? "▴" : "▾"}
              </span>
            </button>

            {open ? (
              <div className="console-member-link-picker__panel">
                <input
                  ref={searchRef}
                  className="console-input w-full"
                  value={memberQuery}
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    showResults && activeIndex >= 0
                      ? `${listId}-option-${activeIndex}`
                      : undefined
                  }
                  autoComplete="off"
                  placeholder="Cari CUS…"
                  onChange={(event) => setMemberQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (!showResults || results.length === 0) {
                      if (event.key === "Escape") setOpen(false);
                      return;
                    }
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveIndex((index) => (index + 1) % results.length);
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveIndex((index) =>
                        index <= 0 ? results.length - 1 : index - 1,
                      );
                    } else if (event.key === "Enter" && activeIndex >= 0) {
                      event.preventDefault();
                      selectMember(results[activeIndex]!);
                    } else if (event.key === "Escape") {
                      setOpen(false);
                    }
                  }}
                />

                <ul id={listId} className="console-member-link-picker__list" role="listbox">
                  {memberQuery.trim().length < 2 ? (
                    <li className="console-member-link-picker__empty">
                      Ketik minimal 2 karakter ID member.
                    </li>
                  ) : loading ? (
                    <li className="console-member-link-picker__empty">Mencari…</li>
                  ) : results.length === 0 ? (
                    <li className="console-member-link-picker__empty">Member tidak ditemukan.</li>
                  ) : (
                    results.map((member, index) => (
                      <li key={member.id} role="presentation">
                        <button
                          id={`${listId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={activeIndex === index}
                          className={`console-member-link-picker__option${
                            activeIndex === index
                              ? " console-member-link-picker__option--active"
                              : ""
                          }`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectMember(member)}
                        >
                          <span className="console-member-link-picker__option-row">
                            <span className="console-member-link-picker__option-code">
                              {member.memberCode}
                            </span>
                            <span className="console-member-link-picker__option-name">
                              {member.name}
                            </span>
                          </span>
                          <span className="console-member-link-picker__option-meta">
                            {formatRupiah(member.saldo)}
                            {member.email ? ` · ${member.email}` : ""}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="console-order-actions__step-foot">
          <button type="submit" className="console-btn-secondary" disabled={!selectedMember}>
            Kaitkan ke member
          </button>
        </div>
      </form>
    </section>
  );
}
