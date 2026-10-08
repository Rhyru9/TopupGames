"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  countSkusForCheckScope,
  runProductSkusAvailabilityCheck,
  type SkuCheckScopeOption,
} from "@/app/console/(panel)/product-skus/check-actions";
import type {
  SkuAvailabilityCheckItem,
  SkuAvailabilityCheckOutcome,
  SyncSkuAvailabilityResult,
} from "@/lib/providers/catalog/sync-sku-availability";
import { providerUsesCatalogBrand } from "@/lib/catalog-products/sku-catalog-brand";
import { productStatusLabel } from "@/lib/product-labels";
import { ConsolePaginationClient } from "@/components/console/console-pagination-client";
import { DEFAULT_PAGE_SIZE } from "@/lib/console-pagination";

const MAX_SKUS_PER_CHECK = 500;

type ProductSkuAvailabilityCheckPageProps = {
  scopeOptions: SkuCheckScopeOption;
  initialSkuIds?: string[];
  initialProductId?: string;
  initialProviderId?: string;
};

type ScopeMode = "selected" | "product" | "provider" | "all";

type OutcomeFilterKey =
  | "all"
  | "available"
  | "unavailable"
  | "not_found"
  | "failed"
  | "skipped";

const OUTCOME_LABEL: Record<SkuAvailabilityCheckOutcome, string> = {
  available: "Tersedia",
  unavailable: "Gangguan",
  not_found: "Tidak ketemu",
  skipped_manual: "Manual",
  skipped_unsupported: "Tidak didukung",
  not_configured: "Belum dikonfigurasi",
  fetch_error: "Gagal fetch",
};

const OUTCOME_BADGE: Record<SkuAvailabilityCheckOutcome, string> = {
  available: "console-badge--success",
  unavailable: "console-badge--danger",
  not_found: "console-badge--warning",
  skipped_manual: "console-badge--muted",
  skipped_unsupported: "console-badge--muted",
  not_configured: "console-badge--danger",
  fetch_error: "console-badge--danger",
};

const OUTCOME_FILTERS: { key: OutcomeFilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "available", label: "Tersedia" },
  { key: "unavailable", label: "Gangguan" },
  { key: "not_found", label: "Tidak ketemu" },
  { key: "failed", label: "Gagal cek" },
  { key: "skipped", label: "Dilewati" },
];

function resolveInitialMode(input: {
  initialSkuIds?: string[];
  initialProductId?: string;
  initialProviderId?: string;
}): ScopeMode {
  if (input.initialSkuIds?.length) return "selected";
  if (input.initialProductId) return "product";
  if (input.initialProviderId) return "provider";
  return "product";
}

function matchesOutcomeFilter(item: SkuAvailabilityCheckItem, filter: OutcomeFilterKey) {
  switch (filter) {
    case "all":
      return true;
    case "available":
      return item.outcome === "available";
    case "unavailable":
      return item.outcome === "unavailable";
    case "not_found":
      return item.outcome === "not_found";
    case "failed":
      return item.outcome === "fetch_error" || item.outcome === "not_configured";
    case "skipped":
      return item.outcome === "skipped_manual" || item.outcome === "skipped_unsupported";
    default:
      return true;
  }
}

function countForOutcomeFilter(items: SkuAvailabilityCheckItem[], filter: OutcomeFilterKey) {
  return items.filter((item) => matchesOutcomeFilter(item, filter)).length;
}

function estimateScopeCount(
  mode: ScopeMode,
  scopeOptions: SkuCheckScopeOption,
  selectedProductId: string,
  selectedProviderId: string,
  initialSkuIds?: string[],
): number {
  if (mode === "selected") return initialSkuIds?.length ?? 0;
  if (mode === "all") return scopeOptions.totalSkuCount;
  if (mode === "product") {
    return scopeOptions.products.find((p) => p.id === selectedProductId)?.skuCount ?? 0;
  }
  return scopeOptions.providers.find((p) => p.id === selectedProviderId)?.skuCount ?? 0;
}

function buildScopePayload(
  mode: ScopeMode,
  initialSkuIds: string[] | undefined,
  selectedProductId: string,
  selectedProviderId: string,
) {
  if (mode === "selected" && initialSkuIds?.length) {
    return { ids: initialSkuIds };
  }
  if (mode === "product" && selectedProductId) {
    return { productId: selectedProductId };
  }
  if (mode === "provider" && selectedProviderId) {
    return { providerId: selectedProviderId };
  }
  if (mode === "all") {
    return { all: true };
  }
  return null;
}

function SkuCheckKpis({ result }: { result: SyncSkuAvailabilityResult }) {
  const kpis = [
    { label: "Total", value: result.total },
    { label: "Tersedia", value: result.available },
    { label: "Gangguan", value: result.unavailable },
    { label: "Tidak ketemu", value: result.skippedNotFound },
    {
      label: "Status diubah",
      value: result.updated,
      title: "SKU yang status toko-nya otomatis disesuaikan dengan provider",
    },
  ];

  return (
    <div className="console-sku-check__stats" role="list" aria-label="Ringkasan hasil cek">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="console-stat-card console-sku-check__stat"
          role="listitem"
          title={kpi.title}
        >
          <p className="console-stat-card__label">{kpi.label}</p>
          <p className="console-stat-card__value">{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}

function SkuCheckResultTable({ items }: { items: SkuAvailabilityCheckItem[] }) {
  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--sku-check">
        <thead>
          <tr>
            <th className="console-table__name-head">SKU</th>
            <th>Produk</th>
            <th className="console-table__brand-head">Brand</th>
            <th>Provider / Kode</th>
            <th>Status toko</th>
            <th>Hasil cek</th>
            <th className="console-table--sku-check__detail-head">Keterangan</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <p className="console-table__primary console-table__primary--wrap">{item.name}</p>
              </td>
              <td>
                <p className="console-table__cell-text">{item.productName}</p>
              </td>
              <td className="console-table__brand-cell">
                {item.providerCatalogBrand ? (
                  <p className="console-table__brand-readonly" title={item.providerCatalogBrand}>
                    {item.providerCatalogBrand}
                  </p>
                ) : providerUsesCatalogBrand(item.providerSlug) ? (
                  <Link
                    href={`/console/product-skus/${item.id}/edit`}
                    className="console-badge console-badge--warning console-table__brand-missing"
                  >
                    Belum diset
                  </Link>
                ) : (
                  <span className="console-table__muted">—</span>
                )}
              </td>
              <td>
                <div className="console-table__cell-stack">
                  <p className="console-table__primary">{item.providerName}</p>
                  <code className="console-table__code">{item.providerSku}</code>
                </div>
              </td>
              <td>
                <span
                  className={`console-badge ${
                    item.localStatus === "AVAILABLE"
                      ? "console-badge--success"
                      : "console-badge--danger"
                  }`}
                >
                  {productStatusLabel(item.localStatus)}
                </span>
              </td>
              <td className="console-table--sku-check__outcome-cell">
                <span className={`console-badge ${OUTCOME_BADGE[item.outcome]}`}>
                  {OUTCOME_LABEL[item.outcome]}
                </span>
                {item.statusUpdated ? (
                  <p className="console-sku-check__sync-note">Status disesuaikan otomatis</p>
                ) : null}
              </td>
              <td className="console-table--sku-check__detail-cell">
                {!item.statusUpdated && item.message ? (
                  <p className="console-sku-check__detail-text" title={item.message}>
                    {item.message}
                  </p>
                ) : (
                  <span className="console-table__muted">—</span>
                )}
              </td>
              <td className="console-table__actions-cell">
                <Link href={`/console/product-skus/${item.id}/edit`} className="console-table__link">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductSkuAvailabilityCheckPage({
  scopeOptions,
  initialSkuIds,
  initialProductId,
  initialProviderId,
}: ProductSkuAvailabilityCheckPageProps) {
  const hasInitialSelection = Boolean(initialSkuIds?.length);
  const [scopeMode, setScopeMode] = useState<ScopeMode>(() =>
    resolveInitialMode({ initialSkuIds, initialProductId, initialProviderId }),
  );
  const [selectedProductId, setSelectedProductId] = useState(
    initialProductId ?? scopeOptions.products[0]?.id ?? "",
  );
  const [selectedProviderId, setSelectedProviderId] = useState(
    initialProviderId ?? scopeOptions.providers[0]?.id ?? "",
  );

  const [pending, startTransition] = useTransition();
  const [countPending, startCountTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncSkuAvailabilityResult | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilterKey>("all");
  const [lastScopeLabel, setLastScopeLabel] = useState<string | null>(null);
  const [preciseCount, setPreciseCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const estimatedCount = useMemo(
    () =>
      estimateScopeCount(
        scopeMode,
        scopeOptions,
        selectedProductId,
        selectedProviderId,
        initialSkuIds,
      ),
    [scopeMode, scopeOptions, selectedProductId, selectedProviderId, initialSkuIds],
  );

  const displayCount = preciseCount ?? estimatedCount;
  const overLimit = displayCount > MAX_SKUS_PER_CHECK;
  const scopePayload = buildScopePayload(
    scopeMode,
    initialSkuIds,
    selectedProductId,
    selectedProviderId,
  );
  const canRun =
    Boolean(scopePayload) &&
    displayCount > 0 &&
    !overLimit &&
    !pending &&
    (scopeMode !== "product" || Boolean(selectedProductId)) &&
    (scopeMode !== "provider" || Boolean(selectedProviderId));

  function scopeLabelForMode(mode: ScopeMode): string {
    if (mode === "selected") {
      return `${initialSkuIds?.length ?? 0} SKU terpilih`;
    }
    if (mode === "all") {
      return `Semua SKU (${scopeOptions.totalSkuCount})`;
    }
    if (mode === "product") {
      const product = scopeOptions.products.find((p) => p.id === selectedProductId);
      return product ? `Produk: ${product.name}` : "Produk";
    }
    const provider = scopeOptions.providers.find((p) => p.id === selectedProviderId);
    return provider ? `Provider: ${provider.name}` : "Provider";
  }

  function selectScope(mode: ScopeMode) {
    setScopeMode(mode);
    setPreciseCount(null);
  }

  function refreshPreciseCount() {
    if (!scopePayload) {
      setPreciseCount(null);
      return;
    }
    startCountTransition(async () => {
      const count = await countSkusForCheckScope(scopePayload);
      setPreciseCount(count);
    });
  }

  function runCheck() {
    if (!scopePayload || !canRun) return;
    setError(null);
    setOutcomeFilter("all");
    setPage(1);
    setLastScopeLabel(scopeLabelForMode(scopeMode));

    startTransition(async () => {
      const response = await runProductSkusAvailabilityCheck(scopePayload);
      if (!response.ok) {
        setError(response.error);
        setResult(null);
        return;
      }
      setResult(response.result);
    });
  }

  const items = useMemo(() => result?.items ?? [], [result?.items]);
  const filteredItems = useMemo(
    () => items.filter((item) => matchesOutcomeFilter(item, outcomeFilter)),
    [items, outcomeFilter],
  );

  const safePage = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    return Math.min(Math.max(page, 1), totalPages);
  }, [filteredItems.length, page, pageSize]);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  return (
    <div
      className={`console-provider-layout console-sku-check${pending ? " console-sku-check--pending" : ""}`}
    >
      <aside className="console-provider-card console-provider-card--tabs" aria-label="Filter cek SKU">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Cek SKU</p>
        </div>

        <div className="console-provider-card__body console-sku-check__sidebar">
          <div className="console-sku-check__field">
            <label htmlFor="sku-check-scope">Lingkup</label>
            <select
              id="sku-check-scope"
              className="console-input"
              value={scopeMode}
              onChange={(event) => selectScope(event.target.value as ScopeMode)}
            >
              {hasInitialSelection ? (
                <option value="selected">Terpilih ({initialSkuIds?.length ?? 0})</option>
              ) : null}
              <option value="product">Per game</option>
              <option value="provider">Per provider</option>
              <option value="all">Semua SKU ({scopeOptions.totalSkuCount})</option>
            </select>
          </div>

          {scopeMode === "product" ? (
            <div className="console-sku-check__field">
              <label htmlFor="sku-check-product">Game</label>
              <select
                id="sku-check-product"
                className="console-input"
                value={selectedProductId}
                onChange={(event) => {
                  setSelectedProductId(event.target.value);
                  setPreciseCount(null);
                }}
              >
                {scopeOptions.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.skuCount})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {scopeMode === "provider" ? (
            <div className="console-sku-check__field">
              <label htmlFor="sku-check-provider">Provider</label>
              <select
                id="sku-check-provider"
                className="console-input"
                value={selectedProviderId}
                onChange={(event) => {
                  setSelectedProviderId(event.target.value);
                  setPreciseCount(null);
                }}
              >
                {scopeOptions.providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} ({provider.skuCount})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <p className="console-sku-check__count">
            <strong>{displayCount.toLocaleString("id-ID")}</strong> SKU
            {countPending ? " …" : null}
            {overLimit ? (
              <span className="console-sku-check__count-warn"> · max {MAX_SKUS_PER_CHECK}</span>
            ) : null}
          </p>

          <div className="console-sku-check__sidebar-actions">
            <button
              type="button"
              className="console-btn-ghost"
              onClick={refreshPreciseCount}
              disabled={!scopePayload || pending || countPending}
            >
              {countPending ? "…" : "Hitung ulang"}
            </button>
            <button
              type="button"
              className="console-btn-primary"
              onClick={runCheck}
              disabled={!canRun}
            >
              {pending ? "Mengecek…" : "Jalankan cek"}
            </button>
          </div>

          {overLimit ? (
            <p className="console-sku-check__note console-sku-check__note--warn">
              Terlalu banyak SKU. Pilih game atau provider yang lebih spesifik.
            </p>
          ) : scopeMode === "all" ? (
            <p className="console-sku-check__note">
              Melostore butuh brand per SKU sebelum bisa dicek.
            </p>
          ) : null}

          {result ? (
            <>
              <div className="console-sku-check__sidebar-divider" role="separator" />
              <p className="console-sku-check__sidebar-heading">Filter hasil</p>
              <div className="console-sku-check__field">
                <label htmlFor="sku-check-outcome">Status</label>
                <select
                  id="sku-check-outcome"
                  className="console-input"
                  value={outcomeFilter}
                  onChange={(event) => {
                    setOutcomeFilter(event.target.value as OutcomeFilterKey);
                    setPage(1);
                  }}
                >
                  {OUTCOME_FILTERS.map((item) => {
                    const count = countForOutcomeFilter(items, item.key);
                    return (
                      <option key={item.key} value={item.key}>
                        {item.label} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="console-sku-check__count">
                <strong>{filteredItems.length.toLocaleString("id-ID")}</strong> ditampilkan
              </p>
              <button
                type="button"
                className="console-btn-secondary console-sku-check__sidebar-rerun"
                onClick={runCheck}
                disabled={pending || !canRun}
              >
                {pending ? "Mengecek…" : "Cek ulang"}
              </button>
            </>
          ) : null}
        </div>
      </aside>

      <div className="console-provider-stack console-sku-check__main">
        {error ? (
          <div className="console-panel console-panel--padded">
            <div className="console-alert console-alert--error" role="alert">
              {error}
            </div>
          </div>
        ) : null}

        {pending && !result ? (
          <div className="console-panel console-panel--padded">
            <p className="console-field__hint">Mengambil katalog provider dan mencocokkan SKU…</p>
          </div>
        ) : null}

        {result ? (
          <section className="console-panel console-sku-check__results">
            <div className="console-sku-check__results-head">
              {lastScopeLabel ? (
                <p className="console-sku-check__scope-tag">
                  Hasil untuk: <strong>{lastScopeLabel}</strong>
                </p>
              ) : null}
              <SkuCheckKpis result={result} />
              <p className="console-sku-check__summary">{result.message}</p>
            </div>

            {filteredItems.length === 0 ? (
              <div className="console-empty console-empty--compact">
                <p className="console-empty__title">Tidak ada SKU di filter ini</p>
              </div>
            ) : (
              <>
                <SkuCheckResultTable items={paginatedItems} />
                <ConsolePaginationClient
                  page={safePage}
                  pageSize={pageSize}
                  total={filteredItems.length}
                  onPageChange={setPage}
                  onPageSizeChange={(next) => {
                    setPageSize(next);
                    setPage(1);
                  }}
                />
              </>
            )}
          </section>
        ) : !pending && !error ? (
          <section className="console-panel console-panel--padded console-sku-check__idle">
            <div className="console-empty console-empty--compact">
              <p className="console-empty__title">Belum ada hasil cek</p>
              <p className="console-empty__text">
                Atur filter di panel kiri, lalu klik <strong>Jalankan cek</strong>.
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
