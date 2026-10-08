import {
  describeActiveSyncFilters,
  syncFilterHintForProvider,
  type ProviderFilterState,
} from "@/lib/providers/catalog/sync-filter-defaults";

type ProductSyncEmptyStateProps = {
  mode: "initial" | "zero-catalog" | "no-search-results";
  providerName?: string;
  providerSlug?: string;
  filters?: ProviderFilterState;
  docsUrl?: string | null;
  totalLoaded?: number;
};

export function ProductSyncEmptyState({
  mode,
  providerName,
  providerSlug,
  filters,
  docsUrl,
  totalLoaded = 0,
}: ProductSyncEmptyStateProps) {
  if (mode === "initial") {
    return (
      <div className="console-provider-card">
        <div className="console-provider-card__body">
          <div className="console-empty product-sync-empty">
            <div className="console-empty__icon" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 7h16M4 12h10M4 17h16" strokeLinecap="round" />
              </svg>
            </div>
            <p className="console-empty__title">Belum ada daftar SKU</p>
            <p className="console-empty__text">
              Pilih produk & provider di kiri, sesuaikan filter, lalu klik{" "}
              <strong>Muat Daftar SKU</strong>.
            </p>
            <ul className="console-checklist product-sync-empty__list">
              <li>
                SKU baru ditandai <span className="console-badge">Baru</span>
              </li>
              <li>
                SKU yang sudah ada ditandai{" "}
                <span className="console-badge console-badge--success">Update</span>
              </li>
              <li>Centang batch → pilih jenis produk → atur margin → simpan</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "zero-catalog") {
    const activeFilterLines =
      providerSlug && filters ? describeActiveSyncFilters(providerSlug, filters) : [];
    const providerFilterHint = providerSlug ? syncFilterHintForProvider(providerSlug) : "";

    return (
      <div className="console-alert" role="status">
        <p>
          <strong>Tidak ada SKU dari {providerName}.</strong> Provider merespons sukses, tapi filter
          tidak cocok dengan katalog aktif.
        </p>
        {activeFilterLines.length > 0 ? (
          <ul className="console-checklist product-sync-empty__list">
            {activeFilterLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="console-field__hint">
            Belum ada filter spesifik — coba isi brand/operator di kiri.
          </p>
        )}
        {providerFilterHint ? <p className="console-field__hint">{providerFilterHint}</p> : null}
        {docsUrl ? (
          <p className="console-field__hint">
            <a href={docsUrl} target="_blank" rel="noreferrer" className="console-table__link">
              Dokumentasi {providerName}
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="console-provider-card__body">
      <p className="console-field__hint">
        {totalLoaded === 0
          ? "Tidak ada SKU yang cocok dengan filter provider."
          : "Tidak ada SKU untuk pencarian/filter status ini."}
      </p>
    </div>
  );
}
