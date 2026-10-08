import type { ProviderFilterState } from "@/lib/providers/catalog/sync-filter-defaults";

type ProductSyncFilterIakProps = {
  filters: ProviderFilterState;
  disabled: boolean;
  onChange: (patch: Partial<ProviderFilterState>) => void;
};

export function ProductSyncFilterIak({
  filters,
  disabled,
  onChange,
}: ProductSyncFilterIakProps) {
  return (
    <>
      <div className="console-field">
        <label className="console-field__label" htmlFor="sync-iak-type">
          Tipe Produk
        </label>
        <input
          id="sync-iak-type"
          value={filters.iakProductType}
          onChange={(event) => onChange({ iakProductType: event.target.value })}
          className="console-input w-full"
          placeholder="game"
          disabled={disabled}
        />
        <p className="console-field__hint">
          Mis. game, pulsa, data, voucher. Kosongkan = semua tipe.
        </p>
      </div>
      <div className="console-field">
        <label className="console-field__label" htmlFor="sync-iak-operator">
          Operator <span className="console-text-muted">(opsional)</span>
        </label>
        <input
          id="sync-iak-operator"
          value={filters.iakOperator}
          onChange={(event) => onChange({ iakOperator: event.target.value })}
          className="console-input w-full"
          placeholder="mobile_legend"
          disabled={disabled}
        />
        <p className="console-field__hint">
          Slug operator IAK, mis. mobile_legend untuk ML. Modal sync ={" "}
          <code>product_price</code> dari API akun Anda (bisa beda dari daftar harga web
          publik). Pastikan mode sandbox di Pengaturan Provider mati untuk harga production.
        </p>
      </div>
    </>
  );
}
