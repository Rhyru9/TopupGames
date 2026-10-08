import Link from "next/link";
import { formatRupiah } from "@/lib/format-rupiah";
import {
  formatVoucherDiscount,
  promoVoucherStockLabel,
  type PromoVoucherListItem,
  voucherRemainingStock,
  voucherScheduleLabel,
} from "@/lib/promo/voucher-data";
import { VoucherPromoRowActions } from "./voucher-promo-row-actions";
import { VoucherPromoStatusToggle } from "./voucher-promo-status-toggle";

type VoucherPromoTableProps = {
  rows: PromoVoucherListItem[];
  hasFilters?: boolean;
};

export function VoucherPromoTable({ rows, hasFilters = false }: VoucherPromoTableProps) {
  if (rows.length === 0) {
    return (
      <div className="console-empty">
        <p className="console-empty__title">
          {hasFilters ? "Tidak ada voucher cocok" : "Belum ada voucher promo"}
        </p>
        <p className="console-empty__text">
          Buat kode diskon untuk campaign promosi di checkout.
        </p>
        {!hasFilters ? (
          <div className="mt-4">
            <Link href="/console/promo/voucher-promo/new" className="console-btn-primary inline-flex">
              + Buat voucher
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Tipe</th>
            <th>Diskon</th>
            <th>Min. order</th>
            <th>Stok</th>
            <th>Periode</th>
            <th>Aktif</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const remaining = voucherRemainingStock(row.stock, row.usedCount);
            return (
              <tr key={row.id}>
                <td>
                  <p className="console-table__primary">{row.code}</p>
                  {row.label ? (
                    <p className="console-field__hint">{row.label}</p>
                  ) : null}
                </td>
                <td>
                  <span className="console-badge console-badge--muted">
                    {row.type === "SPECIAL" ? "Khusus" : "Umum"}
                  </span>
                </td>
                <td>{formatVoucherDiscount(row)}</td>
                <td>
                  {row.type === "SPECIAL" ? "—" : formatRupiah(row.minOrderAmount)}
                </td>
                <td>
                  <strong>{remaining}</strong>
                  <span className="console-field__hint"> / {row.stock}</span>
                  <p className="console-field__hint">{promoVoucherStockLabel(row.stock, row.usedCount)}</p>
                </td>
                <td>
                  <p className="console-table__cell-text">
                    {voucherScheduleLabel(row.startsAt, row.endsAt)}
                  </p>
                </td>
                <td>
                  <VoucherPromoStatusToggle voucherId={row.id} isEnabled={row.isEnabled} />
                </td>
                <td className="console-table__actions-cell">
                  <VoucherPromoRowActions voucherId={row.id} code={row.code} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
