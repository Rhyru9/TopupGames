"use client";

import { Icon } from "@iconify/react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  CATEGORY_ICON_SUGGESTIONS,
  isIconifyIconId,
} from "@/lib/catalog-categories/iconify-icon";

type IconifyPickerProps = {
  name: string;
  label?: string;
  initialValue?: string;
  error?: string;
};

type SearchResponse = {
  icons?: string[];
};

export function IconifyPicker({
  name,
  label = "Icon Kategori",
  initialValue = "",
  error,
}: IconifyPickerProps) {
  const inputId = useId();
  const searchId = useId();
  const [value, setValue] = useState(() =>
    isIconifyIconId(initialValue) ? initialValue.trim() : "",
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([...CATEGORY_ICON_SUGGESTIONS]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([...CATEGORY_ICON_SUGGESTIONS]);
      setSearchError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      startTransition(async () => {
        try {
          const url = new URL("https://api.iconify.design/search");
          url.searchParams.set("query", q);
          url.searchParams.set("limit", "48");
          const res = await fetch(url.toString(), { signal: controller.signal });
          if (!res.ok) throw new Error("Gagal mencari icon.");
          const data = (await res.json()) as SearchResponse;
          setResults(Array.isArray(data.icons) ? data.icons : []);
          setSearchError(null);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setSearchError("Tidak bisa memuat icon dari Iconify. Coba lagi.");
        }
      });
    }, 280);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  return (
    <div className="console-field console-field--full console-iconify">
      <label htmlFor={inputId} className="console-field__label">
        {label}
      </label>
      <input type="hidden" id={inputId} name={name} value={value} />

      <div className="console-iconify__selected">
        <div className="console-iconify__preview" aria-hidden>
          {value ? (
            <Icon icon={value} width={28} height={28} />
          ) : (
            <span className="console-iconify__preview-empty">?</span>
          )}
        </div>
        <div className="console-iconify__selected-meta">
          <p className="console-iconify__selected-name">{value || "Belum dipilih"}</p>
          <p className="console-field__hint">
            Cari &amp; pilih icon dari{" "}
            <a href="https://iconify.design/" target="_blank" rel="noreferrer">
              Iconify
            </a>
            . Opsional.
          </p>
        </div>
        {value ? (
          <button
            type="button"
            className="console-btn-ghost"
            onClick={() => setValue("")}
          >
            Hapus
          </button>
        ) : null}
      </div>

      <label htmlFor={searchId} className="console-field__label console-iconify__search-label">
        Cari icon
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="console-input w-full"
        placeholder="Contoh: gamepad, ticket, mobile…"
        autoComplete="off"
      />

      {searchError ? (
        <p className="console-field__error" role="alert">
          {searchError}
        </p>
      ) : null}

      <div
        className={`console-iconify__grid${isPending ? " console-iconify__grid--loading" : ""}`}
        role="listbox"
        aria-label="Daftar icon"
      >
        {results.length === 0 ? (
          <p className="console-iconify__empty">Tidak ada hasil.</p>
        ) : (
          results.map((icon) => {
            const selected = value === icon;
            return (
              <button
                key={icon}
                type="button"
                role="option"
                aria-selected={selected}
                title={icon}
                className={`console-iconify__item${selected ? " console-iconify__item--selected" : ""}`}
                onClick={() => setValue(icon)}
              >
                <Icon icon={icon} width={22} height={22} />
              </button>
            );
          })
        )}
      </div>

      {error ? <p className="console-field__error">{error}</p> : null}
    </div>
  );
}
