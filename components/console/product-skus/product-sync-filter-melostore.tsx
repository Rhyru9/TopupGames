import type { ProviderFilterState } from "@/lib/providers/catalog/sync-filter-defaults";

type ProductSyncFilterMelostoreProps = {
  filters: ProviderFilterState;
  disabled: boolean;
  brandLocked?: boolean;
  onChange: (patch: Partial<ProviderFilterState>) => void;
  onUnlockBrand?: () => void;
};

export function ProductSyncFilterMelostore({
  filters,
  disabled,
  brandLocked = false,
  onChange,
  onUnlockBrand,
}: ProductSyncFilterMelostoreProps) {
  return (
    <>
      <div className="console-field">
        <label className="console-field__label" htmlFor="sync-brand-name">
          Brand resmi produk
        </label>
        <input
          id="sync-brand-name"
          type="text"
          value={filters.melostoreBrandName}
          onChange={(event) => onChange({ melostoreBrandName: event.target.value })}
          className="console-input w-full"
          disabled={disabled || brandLocked}
          readOnly={brandLocked}
          placeholder="Cth: Mobile Legends (ID)"
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
            Salin dari panel Melostore H2H (cth. Mobile Legends (ID)). Setelah sync, brand ini
            jadi resmi untuk produk ini — jangan isi brand game lain.
          </p>
        )}
      </div>
      <div className="console-field">
        <label className="console-field__label" htmlFor="sync-server">
          Server Code
        </label>
        <input
          id="sync-server"
          value={filters.melostoreServerCode}
          onChange={(event) => onChange({ melostoreServerCode: event.target.value })}
          className="console-input w-full"
          placeholder="Kosongkan = semua server"
          disabled={disabled}
        />
      </div>
    </>
  );
}
