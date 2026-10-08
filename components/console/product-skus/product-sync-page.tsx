"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  getProductSyncDefaultsAction,
  loadProductSyncPreviewAction,
  syncSelectedCatalogProductsAction,
} from "@/app/console/(panel)/product-skus/sync-actions";
import type { GameCatalogActionState } from "@/lib/catalog-products/game-catalog-mutations";
import { ProductSyncEmptyState } from "@/components/console/product-skus/product-sync-empty-state";
import { ProductSyncFilterDigiflazz } from "@/components/console/product-skus/product-sync-filter-digiflazz";
import { ProductSyncFilterIak } from "@/components/console/product-skus/product-sync-filter-iak";
import { ProductSyncFilterMelostore } from "@/components/console/product-skus/product-sync-filter-melostore";
import { ProductSyncSkuPicker } from "@/components/console/product-skus/product-sync-sku-picker";
import {
  catalogItemKey,
  type CatalogItem,
} from "@/lib/providers/catalog/catalog-types";
import type { ProductSyncPreview } from "@/lib/providers/catalog/product-sync-preview";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { useConsoleActionToast } from "@/components/console/use-console-action-toast";
import {
  buildProviderFilterDefaults,
  defaultProviderFilters,
  getCanonicalSyncBrandFromState,
  providerLocksBrand,
  syncBrandsMatch,
  type ProviderFilterState,
} from "@/lib/providers/catalog/sync-filter-defaults";
import { formatRupiah } from "@/lib/format-rupiah";

export type ProductSyncGameOption = {
  id: string;
  name: string;
};

export type ProductSyncProviderOption = {
  id: string;
  name: string;
  slug: string;
  docsUrl?: string | null;
};

type ProductTypeOption = {
  id: string;
  name: string;
};

type StatusFilter = "all" | "new" | "update";

type ProductSyncPageProps = {
  initialProductId: string;
  initialProviderId: string;
  products: ProductSyncGameOption[];
  providers: ProductSyncProviderOption[];
};

const initialState: GameCatalogActionState = {};

function buildSyncUrl(productId: string, providerId: string) {
  const params = new URLSearchParams();
  if (productId) params.set("productId", productId);
  if (providerId) params.set("providerId", providerId);
  const query = params.toString();
  return query ? `/console/product-skus/sync?${query}` : "/console/product-skus/sync";
}

function SyncStep({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={[
        "product-sync-step",
        active ? "product-sync-step--active" : "",
        done ? "product-sync-step--done" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="product-sync-step__num">{done ? "✓" : index}</span>
      <span className="product-sync-step__label">{label}</span>
    </div>
  );
}

function formatAppliedFilters(
  applied?: Record<string, string | number | undefined>,
): string | null {
  if (!applied) return null;
  const parts = Object.entries(applied)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${value}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function canLoadPreview(
  providerSlug: string | undefined,
  filters: ProviderFilterState,
): boolean {
  if (providerSlug === "melostore") return Boolean(filters.melostoreBrandName.trim());
  if (providerSlug === "digiflazz") return Boolean(filters.digiflazzBrand.trim());
  return true;
}

export function ProductSyncPage({
  initialProductId: productId,
  initialProviderId,
  products,
  providers,
}: ProductSyncPageProps) {
  const router = useRouter();
  const confirm = useConsoleConfirm();
  const { notifySuccess, notifyError } = useConsoleActionToast();
  const lastActionToastRef = useRef<string | null>(null);
  const providerId = initialProviderId || providers[0]?.id || "";
  const [filterByProvider, setFilterByProvider] = useState<Record<string, ProviderFilterState>>({});
  const [filtersReady, setFiltersReady] = useState(false);
  const [officialBrand, setOfficialBrand] = useState("");
  const [brandUnlocked, setBrandUnlocked] = useState(false);
  const [productName, setProductName] = useState(
    () => products.find((row) => row.id === productId)?.name ?? "",
  );
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([]);
  const [productTypeId, setProductTypeId] = useState("");
  const [previewScope, setPreviewScope] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [listPage, setListPage] = useState(1);
  const [marginGuest, setMarginGuest] = useState(2000);
  const [marginMember, setMarginMember] = useState(1500);
  const [cashbackPoin, setCashbackPoin] = useState(0);
  const [loadingDefaults, startLoadDefaults] = useTransition();
  const [, startServerAction] = useTransition();

  const [previewState, previewAction, previewPending] = useActionState(
    loadProductSyncPreviewAction,
    initialState,
  );
  const [syncState, syncAction, syncPending] = useActionState(
    syncSelectedCatalogProductsAction,
    initialState,
  );

  const activeProvider = providers.find((row) => row.id === providerId) ?? null;
  const syncScope = `${productId}:${providerId}`;
  const activeProductTypes = productId ? productTypes : [];

  const loadedPreview: ProductSyncPreview | null =
    previewScope === syncScope && previewState.productSyncPreview
      ? previewState.productSyncPreview
      : null;

  const existingSkuKeys = useMemo(() => {
    if (syncState.syncResult && syncState.existingSkuKeys) {
      return syncState.existingSkuKeys;
    }
    if (previewScope === syncScope && previewState.existingSkuKeys) {
      return previewState.existingSkuKeys;
    }
    return [];
  }, [
    syncState.syncResult,
    syncState.existingSkuKeys,
    previewScope,
    syncScope,
    previewState.existingSkuKeys,
  ]);

  const existingKeys = useMemo(() => new Set(existingSkuKeys), [existingSkuKeys]);

  useEffect(() => {
    if (!productId) {
      setFiltersReady(false);
      setOfficialBrand("");
      setBrandUnlocked(false);
      setProductName("");
      setFilterByProvider({});
      setProductTypes([]);
      setProductTypeId("");
      return;
    }

    let cancelled = false;
    setFiltersReady(false);
    setFilterByProvider({});
    setOfficialBrand("");
    setBrandUnlocked(false);

    startLoadDefaults(async () => {
      const defaults = await getProductSyncDefaultsAction(productId);
      if (cancelled) return;

      const next: Record<string, ProviderFilterState> = {};
      for (const provider of providers) {
        const saved = defaults?.savedFilters.find((row) => row.providerId === provider.id);
        next[provider.id] = buildProviderFilterDefaults({
          providerSlug: provider.slug,
          savedFilters: saved?.filters ?? {},
          nicknameCheckCode: defaults?.product.nicknameCheckCode,
        });
      }

      const active = providers.find((row) => row.id === providerId) ?? providers[0] ?? null;
      const activeFilters = active ? next[active.id] : undefined;
      const savedBrand =
        active && activeFilters
          ? getCanonicalSyncBrandFromState(active.slug, activeFilters)
          : "";

      setFilterByProvider(next);
      setProductName(defaults?.product.name ?? products.find((row) => row.id === productId)?.name ?? "");
      setOfficialBrand(savedBrand);
      setBrandUnlocked(!savedBrand || !providerLocksBrand(active?.slug ?? ""));
      setProductTypes(defaults?.productTypes ?? []);
      setProductTypeId((current) => {
        const types = defaults?.productTypes ?? [];
        if (types.some((type) => type.id === current)) return current;
        // Wajib pilih jenis manual — jangan auto ke opsi pertama.
        return "";
      });
      setFiltersReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [productId, providerId, providers, products]);

  const providerPreview = loadedPreview?.providers.find((row) => row.providerId === providerId);

  const loadedStats = useMemo(() => {
    if (!providerPreview || providerPreview.error) {
      return { total: 0, newCount: 0, updateCount: 0 };
    }

    let newCount = 0;
    let updateCount = 0;
    for (const item of providerPreview.items) {
      const key = catalogItemKey(item.providerId, item.sku);
      if (existingKeys.has(key)) updateCount += 1;
      else newCount += 1;
    }

    return {
      total: providerPreview.totalFetched,
      newCount,
      updateCount,
    };
  }, [providerPreview, existingKeys]);

  function resetPreviewUi() {
    setPreviewScope(null);
    setSelectedKeys(new Set());
    setSearchQuery("");
    setStatusFilter("all");
    setListPage(1);
  }

  function handleProductChange(nextProductId: string) {
    resetPreviewUi();
    setFiltersReady(false);
    setFilterByProvider({});
    setOfficialBrand("");
    setBrandUnlocked(false);
    setProductTypes([]);
    setProductTypeId("");
    setProductName("");
    router.replace(buildSyncUrl(nextProductId, providerId));
  }

  function handleProviderChange(nextProviderId: string) {
    resetPreviewUi();
    setFiltersReady(false);
    setOfficialBrand("");
    setBrandUnlocked(false);
    router.replace(buildSyncUrl(productId, nextProviderId));
  }

  function updateFilter(patch: Partial<ProviderFilterState>) {
    if (!providerId) return;
    setFilterByProvider((current) => ({
      ...current,
      [providerId]: { ...(current[providerId] ?? defaultProviderFilters()), ...patch },
    }));
  }

  async function handleUnlockBrand() {
    if (!officialBrand) {
      setBrandUnlocked(true);
      return;
    }
    const confirmed = await confirm({
      title: "Ubah brand resmi?",
      description: `Brand tersimpan untuk produk ini: "${officialBrand}". Mengubahnya bisa memasukkan SKU game lain ke produk "${productName || "ini"}".`,
      confirmLabel: "Ubah brand",
      variant: "danger",
    });
    if (confirmed) setBrandUnlocked(true);
  }

  function toggleItem(item: CatalogItem, checked: boolean) {
    const key = catalogItemKey(item.providerId, item.sku);
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function togglePage(items: CatalogItem[], checked: boolean) {
    setSelectedKeys((current) => {
      const next = new Set(current);
      for (const item of items) {
        const key = catalogItemKey(item.providerId, item.sku);
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  const previewItems = providerPreview?.items ?? [];

  const selectedItems = previewItems
    .filter((item) => selectedKeys.has(catalogItemKey(item.providerId, item.sku)))
    .map((item) => ({
      providerId: item.providerId,
      sku: item.sku,
      providerTypeKey: item.providerTypeKey,
      name: item.name,
      costPrice: item.costPrice,
      isAvailable: item.isAvailable,
      catalogBrand:
        item.brand ||
        (activeProvider?.slug === "iak"
          ? filters.iakOperator.trim() || undefined
          : undefined),
    }));

  const filters = filterByProvider[providerId] ?? defaultProviderFilters();
  const filterDisabled = loadingDefaults || !filtersReady;
  const locksBrand = providerLocksBrand(activeProvider?.slug ?? "");
  const currentBrand = activeProvider
    ? getCanonicalSyncBrandFromState(activeProvider.slug, filters)
    : "";
  const brandLocked = locksBrand && Boolean(officialBrand) && !brandUnlocked;
  const brandChangedFromOfficial =
    locksBrand &&
    Boolean(officialBrand) &&
    Boolean(currentBrand) &&
    !syncBrandsMatch(officialBrand, currentBrand);

  function buildPreviewFormData(allowBrandChange: boolean): FormData {
    const formData = new FormData();
    formData.set("productId", productId);
    if (allowBrandChange) formData.set("allowBrandChange", "1");

    if (!activeProvider) return formData;

    formData.append("providerIds", providerId);
    formData.set(`providerSlug_${providerId}`, activeProvider.slug);

    if (activeProvider.slug === "digiflazz") {
      formData.set(`digiflazzBrand_${providerId}`, filters.digiflazzBrand);
      formData.set(`digiflazzType_${providerId}`, filters.digiflazzType);
    } else if (activeProvider.slug === "melostore") {
      formData.set(`melostoreBrandName_${providerId}`, filters.melostoreBrandName);
      formData.set(`melostoreServerCode_${providerId}`, filters.melostoreServerCode);
    } else if (activeProvider.slug === "iak") {
      formData.set(`iakProductType_${providerId}`, filters.iakProductType);
      formData.set(`iakOperator_${providerId}`, filters.iakOperator);
    }

    return formData;
  }

  async function handlePreviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      previewPending ||
      loadingDefaults ||
      !filtersReady ||
      !productId ||
      !providerId ||
      !canLoadPreview(activeProvider?.slug, filters)
    ) {
      return;
    }

    let allowBrandChange = false;
    if (brandChangedFromOfficial) {
      const confirmed = await confirm({
        title: "Brand berbeda dari resmi produk",
        description: `Produk "${productName}" brand resminya "${officialBrand}", filter sekarang "${currentBrand}". Lanjut bisa memasukkan SKU game lain ke produk ini.`,
        confirmLabel: "Lanjut muat SKU",
        variant: "danger",
      });
      if (!confirmed) return;
      allowBrandChange = true;
    }

    setSelectedKeys(new Set());
    setSearchQuery("");
    setStatusFilter("all");
    setListPage(1);
    setPreviewScope(syncScope);
    startServerAction(() => {
      previewAction(buildPreviewFormData(allowBrandChange));
    });
  }

  async function handleSyncSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (syncPending || selectedKeys.size === 0 || !productId || !productTypeId) return;

    const confirmed = await confirm({
      title: "Simpan SKU ke produk ini?",
      description: `${selectedKeys.size} SKU akan disimpan ke "${productName}"${currentBrand ? ` dengan brand "${currentBrand}"` : ""}. Pastikan brand cocok dengan produk target.`,
      confirmLabel: "Simpan batch",
      variant: "default",
    });
    if (!confirmed) return;

    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("productTypeId", productTypeId);
    formData.set("selectedItems", JSON.stringify(selectedItems));
    formData.set("marginGuest", String(marginGuest));
    formData.set("marginMember", String(marginMember));
    formData.set("cashbackPoin", String(cashbackPoin));
    setSelectedKeys(new Set());
    startServerAction(() => {
      syncAction(formData);
    });
  }

  const activeError = syncState.error || previewState.error;
  const activeSuccess = syncState.success || previewState.success;
  const previewReady = Boolean(
    previewScope === syncScope && loadedPreview && providerPreview && !providerPreview.error,
  );

  useEffect(() => {
    const signature = activeError
      ? `error:${activeError}`
      : activeSuccess
        ? `success:${activeSuccess}`
        : null;
    if (!signature || signature === lastActionToastRef.current) return;
    lastActionToastRef.current = signature;
    if (activeError) notifyError(activeError);
    else if (activeSuccess) notifySuccess(activeSuccess);
  }, [activeError, activeSuccess, notifyError, notifySuccess]);

  useEffect(() => {
    if (!previewReady || !locksBrand || !currentBrand) return;
    setOfficialBrand(currentBrand);
    setBrandUnlocked(false);
  }, [previewReady, locksBrand, currentBrand]);

  const exampleItem = selectedItems[0];
  const showEmptyCatalogAlert = previewReady && loadedStats.total === 0;
  const appliedFiltersLabel = formatAppliedFilters(providerPreview?.appliedFilters);
  const pagesFetched = providerPreview?.pagesFetched;

  return (
    <div className="product-sync-layout">
      <aside className="product-sync-setup" aria-label="Pengaturan sync">
        <div className="console-provider-card">
          <div className="console-provider-card__head">
            <p className="console-provider-card__title">1 · Target Sync</p>
          </div>
          <div className="console-provider-card__body console-provider-form-stack">
            <div className="console-field">
              <label htmlFor="sync-product-id" className="console-field__label">
                Produk *
              </label>
              <select
                id="sync-product-id"
                value={productId}
                onChange={(event) => handleProductChange(event.target.value)}
                className="console-input w-full"
                required
              >
                <option value="">— Pilih produk dulu —</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {!productId ? (
                <p className="console-field__hint">
                  Wajib dipilih sebelum muat SKU, supaya tidak salah masuk ke produk lain.
                </p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="sync-provider-id" className="console-field__label">
                Provider
              </label>
              <select
                id="sync-provider-id"
                value={providerId}
                onChange={(event) => handleProviderChange(event.target.value)}
                className="console-input w-full"
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {activeProvider ? (
          <div className="console-provider-card">
            <div className="console-provider-card__head">
              <p className="console-provider-card__title">2 · Filter Provider</p>
            </div>
            <div className="console-provider-card__body console-provider-form-stack">
              <p className="console-field__hint product-sync-setup__filter-note">
                Filter menentukan SKU dari {activeProvider.name}. Brand resmi disimpan per produk —
                ganti produk akan memuat ulang brand produk itu (bukan sisa brand sebelumnya).
              </p>

              {productName && currentBrand ? (
                <div
                  className={
                    brandChangedFromOfficial
                      ? "console-alert console-alert--error"
                      : "console-alert console-alert--success"
                  }
                  role="status"
                >
                  Target: <strong>{productName}</strong>
                  {" ← "}
                  Brand: <strong>{currentBrand}</strong>
                  {officialBrand && !brandChangedFromOfficial
                    ? " (brand resmi tersimpan)"
                    : null}
                  {brandChangedFromOfficial
                    ? ` — berbeda dari resmi "${officialBrand}"`
                    : null}
                </div>
              ) : null}

              {activeProvider.slug === "digiflazz" ? (
                <ProductSyncFilterDigiflazz
                  filters={filters}
                  disabled={filterDisabled}
                  brandLocked={brandLocked}
                  onChange={updateFilter}
                  onUnlockBrand={() => void handleUnlockBrand()}
                />
              ) : null}

              {activeProvider.slug === "melostore" ? (
                <ProductSyncFilterMelostore
                  filters={filters}
                  disabled={filterDisabled}
                  brandLocked={brandLocked}
                  onChange={updateFilter}
                  onUnlockBrand={() => void handleUnlockBrand()}
                />
              ) : null}

              {activeProvider.slug === "iak" ? (
                <ProductSyncFilterIak
                  filters={filters}
                  disabled={filterDisabled}
                  onChange={updateFilter}
                />
              ) : null}

              <form onSubmit={handlePreviewSubmit}>
                <button
                  type="submit"
                  disabled={
                    previewPending ||
                    loadingDefaults ||
                    !filtersReady ||
                    !productId ||
                    !providerId ||
                    !canLoadPreview(activeProvider.slug, filters)
                  }
                  className="console-btn-primary product-sync-setup__load"
                >
                  {previewPending ? "Memuat SKU..." : "Muat Daftar SKU"}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="product-sync-main">
        <div className="product-sync-steps" aria-label="Langkah sync">
          <SyncStep
            index={1}
            label="Target & filter"
            active={!previewReady}
            done={Boolean(productId && providerId)}
          />
          <SyncStep
            index={2}
            label="Pilih SKU"
            active={previewReady && selectedKeys.size === 0}
            done={previewReady}
          />
          <SyncStep
            index={3}
            label="Simpan batch"
            active={selectedKeys.size > 0}
            done={Boolean(syncState.syncResult)}
          />
        </div>

        {!previewReady ? <ProductSyncEmptyState mode="initial" /> : null}

        {loadedPreview && providerPreview?.error ? (
          <div className="console-alert console-alert--error" role="alert">
            {providerPreview.error}
          </div>
        ) : null}

        {previewReady ? (
          <>
            {showEmptyCatalogAlert ? (
              <ProductSyncEmptyState
                mode="zero-catalog"
                providerName={activeProvider?.name}
                providerSlug={activeProvider?.slug}
                filters={filters}
                docsUrl={activeProvider?.docsUrl}
              />
            ) : null}

            <div className="product-sync-stats">
              <div className="product-sync-stat">
                <span className="product-sync-stat__label">Dimuat</span>
                <strong>{loadedStats.total}</strong>
              </div>
              <div className="product-sync-stat">
                <span className="product-sync-stat__label">Baru</span>
                <strong>{loadedStats.newCount}</strong>
              </div>
              <div className="product-sync-stat">
                <span className="product-sync-stat__label">Update</span>
                <strong>{loadedStats.updateCount}</strong>
              </div>
              <div className="product-sync-stat product-sync-stat--accent">
                <span className="product-sync-stat__label">Terpilih</span>
                <strong>{selectedKeys.size}</strong>
              </div>
            </div>

            {appliedFiltersLabel || pagesFetched ? (
              <p className="console-field__hint product-sync-meta">
                {appliedFiltersLabel ? <>Filter API: {appliedFiltersLabel}</> : null}
                {appliedFiltersLabel && pagesFetched ? " · " : null}
                {pagesFetched ? <>Halaman di-fetch: {pagesFetched}</> : null}
              </p>
            ) : null}

            <ProductSyncSkuPicker
              providerName={activeProvider?.name ?? ""}
              items={previewItems}
              existingKeys={existingKeys}
              selectedKeys={selectedKeys}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              listPage={listPage}
              totalLoaded={loadedStats.total}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setListPage(1);
              }}
              onStatusFilterChange={(value) => {
                setStatusFilter(value);
                setListPage(1);
              }}
              onListPageChange={setListPage}
              onToggleItem={toggleItem}
              onTogglePage={togglePage}
            />

            <div className="console-provider-card product-sync-save">
              <div className="console-provider-card__head">
                <p className="console-provider-card__title">3 · Simpan Batch Terpilih</p>
              </div>
              <form onSubmit={handleSyncSubmit} className="console-provider-card__body console-provider-form-stack">
                {activeProductTypes.length === 0 ? (
                  <div className="console-alert console-alert--error" role="alert">
                    Belum ada jenis produk untuk produk ini.{" "}
                    <Link href="/console/jenis-produk" className="console-table__link">
                      Buat jenis produk dulu
                    </Link>
                  </div>
                ) : (
                  <div className="console-field">
                    <label htmlFor="sync-product-kind" className="console-field__label">
                      Jenis Produk
                    </label>
                    <select
                      id="sync-product-kind"
                      value={productTypeId}
                      onChange={(event) => setProductTypeId(event.target.value)}
                      className="console-input w-full"
                      required
                    >
                      <option value="">— Pilih jenis —</option>
                      {activeProductTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <p className="console-field__hint">
                      Semua SKU tercentang masuk ke jenis ini. Ulangi dengan batch & jenis berbeda
                      jika perlu.
                    </p>
                  </div>
                )}

                <div className="console-form__grid">
                  <div className="console-field">
                    <label htmlFor="sync-margin-guest" className="console-field__label">
                      Margin Guest
                    </label>
                    <input
                      id="sync-margin-guest"
                      type="number"
                      min={0}
                      step={100}
                      value={marginGuest}
                      onChange={(event) => setMarginGuest(Number(event.target.value) || 0)}
                      className="console-input w-full"
                    />
                  </div>
                  <div className="console-field">
                    <label htmlFor="sync-margin-member" className="console-field__label">
                      Margin Member
                    </label>
                    <input
                      id="sync-margin-member"
                      type="number"
                      min={0}
                      step={100}
                      value={marginMember}
                      onChange={(event) => setMarginMember(Number(event.target.value) || 0)}
                      className="console-input w-full"
                    />
                  </div>
                  <div className="console-field">
                    <label htmlFor="sync-cashback-poin" className="console-field__label">
                      Cashback poin
                    </label>
                    <input
                      id="sync-cashback-poin"
                      type="number"
                      min={0}
                      step={1}
                      value={cashbackPoin}
                      onChange={(event) => setCashbackPoin(Number(event.target.value) || 0)}
                      className="console-input w-full"
                    />
                    <p className="console-field__hint">
                      Hanya untuk SKU baru. SKU yang sudah ada mempertahankan cashback lama.
                    </p>
                  </div>
                </div>

                {exampleItem ? (
                  <p className="console-field__hint product-sync-save__preview">
                    Contoh harga jual ({exampleItem.name.slice(0, 40)}
                    {exampleItem.name.length > 40 ? "…" : ""}): Guest{" "}
                    <strong>{formatRupiah(exampleItem.costPrice + marginGuest)}</strong> · Member{" "}
                    <strong>{formatRupiah(exampleItem.costPrice + marginMember)}</strong>
                  </p>
                ) : (
                  <p className="console-field__hint">
                    Centang SKU di tabel untuk melihat preview harga jual.
                  </p>
                )}

                <div className="product-sync-save__actions">
                  <p className="product-sync-save__count">
                    <strong>{selectedKeys.size}</strong> SKU siap disimpan
                  </p>
                  <button
                    type="submit"
                    disabled={
                      syncPending ||
                      selectedKeys.size === 0 ||
                      !productId ||
                      !productTypeId ||
                      activeProductTypes.length === 0
                    }
                    className="console-btn-primary product-sync-save__submit"
                  >
                    {syncPending ? "Menyimpan..." : "Simpan Terpilih"}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
