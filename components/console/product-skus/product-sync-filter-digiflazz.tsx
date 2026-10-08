import type { ProviderFilterState } from "@/lib/providers/catalog/sync-filter-defaults";

type ProductSyncFilterDigiflazzProps = {
  filters: ProviderFilterState;
  disabled: boolean;
  brandLocked?: boolean;
  onChange: (patch: Partial<ProviderFilterState>) => void;
  onUnlockBrand?: () => void;
};

export function ProductSyncFilterDigiflazz({
  filters,
  disabled,
  brandLocked = false,
  onChange,
  onUnlockBrand,
}: ProductSyncFilterDigiflazzProps) {
  return (
    <>
      <div className="console-field">
        <label className="console-field__label" htmlFor="sync-brand">
          Brand resmi produk
        </label>
        <input
          id="sync-brand"
          value={filters.digiflazzBrand}
          onChange={(event) => onChange({ digiflazzBrand: event.target.value })}
          className="console-input w-full"
          placeholder="MOBILE LEGENDS"
          disabled={disabled || brandLocked}
          readOnly={brandLocked}
          required
        />
        {brandLocked ? (
          <p className="console-field__hint">
            Terkunci ke brand tersimpan produk ini.{" "}
            <button
              type="button"
              className="console-table__link"
              onClick={onUnlockBrand}
              disabled={disabled}
            >
              Ubah brand
            </button>
          </p>
        ) : (
          <p className="console-field__hint">
            Salin dari panel Digiflazz. Setelah sync berhasil, brand ini jadi resmi untuk produk
            ini (bukan nama produk toko).
          </p>
        )}
      </div>
      <div className="console-field">
        <label className="console-field__label" htmlFor="sync-type">
          Type <span className="console-text-muted">(opsional)</span>
        </label>
        <input
          id="sync-type"
          value={filters.digiflazzType}
          onChange={(event) => onChange({ digiflazzType: event.target.value })}
          className="console-input w-full"
          placeholder="Kosongkan = semua type"
          disabled={disabled}
        />
      </div>
    </>
  );
}
