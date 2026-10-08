import Image from "next/image";
import { PopupRowActions } from "./popup-row-actions";
import type { PopupListItem } from "@/lib/content/popup-mutations";

type PopupTableProps = {
  items: PopupListItem[];
};

export function PopupTable({ items }: PopupTableProps) {
  if (items.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="4" y="5" width="16" height="14" rx="2" />
            <path d="M9 12h6M12 9v6" strokeLinecap="round" />
          </svg>
        </div>
        <p className="console-empty__title">Belum ada popup</p>
        <p className="console-empty__text">
          Tambahkan popup gambar atau teks untuk beranda, katalog, dan detail produk.
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th>Popup</th>
            <th>Mode</th>
            <th>Dismiss</th>
            <th className="console-table__count-head">Urutan</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="console-table__game">
                  <div className="console-table__thumb console-table__thumb--wide">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        width={72}
                        height={40}
                        className="console-table__thumb-img"
                      />
                    ) : (
                      <span className="console-table__thumb-fallback" aria-hidden />
                    )}
                  </div>
                  <div className="console-table__game-meta">
                    <p className="console-table__primary">{item.title}</p>
                    <p className="console-field__hint">
                      {item.isActive ? "Aktif" : "Nonaktif"}
                      {item.ctaHref ? ` · ${item.ctaHref}` : ""}
                    </p>
                  </div>
                </div>
              </td>
              <td>
                <span className="console-badge console-badge--muted">
                  {item.mode === "IMAGE" ? "Gambar" : "Teks"}
                </span>
              </td>
              <td>{item.dismissMinutes} menit</td>
              <td className="console-table__count-cell">{item.sortOrder}</td>
              <td className="console-table__actions-cell">
                <PopupRowActions
                  popupId={item.id}
                  popupTitle={item.title}
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
