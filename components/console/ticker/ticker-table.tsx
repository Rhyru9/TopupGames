import { TickerRowActions } from "./ticker-row-actions";
import type { TickerListItem } from "@/lib/content/ticker-mutations";

type TickerTableProps = {
  items: TickerListItem[];
};

export function TickerTable({ items }: TickerTableProps) {
  if (items.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 8h16M4 12h10M4 16h13" strokeLinecap="round" />
            <path d="M18 10l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="console-empty__title">Belum ada teks berjalan</p>
        <p className="console-empty__text">
          Tambahkan highlight promo singkat untuk ticker di beranda.
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--ticker">
        <thead>
          <tr>
            <th>Teks</th>
            <th>Link</th>
            <th className="console-table__count-head">Urutan</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <p className="console-table__primary">
                  <span className="text-[var(--color-neon,#ff7a1a)]">{item.label}</span>
                  <span className="mx-1.5 text-[var(--color-chrome-dim,#8d8d8d)]">/</span>
                  <span className="font-normal text-[var(--color-chrome-dim,#8d8d8d)]">
                    {item.detail}
                  </span>
                </p>
                {!item.isActive ? (
                  <p className="console-field__hint">Nonaktif</p>
                ) : null}
              </td>
              <td>
                {item.href ? (
                  <code className="console-table__code">{item.href}</code>
                ) : (
                  <span className="console-field__hint">—</span>
                )}
              </td>
              <td className="console-table__count-cell">{item.sortOrder}</td>
              <td className="console-table__actions-cell">
                <TickerRowActions
                  tickerId={item.id}
                  tickerLabel={item.label}
                  isActive={item.isActive}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
