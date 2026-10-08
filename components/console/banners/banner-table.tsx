import Image from "next/image";
import { BannerRowActions } from "./banner-row-actions";
import type { BannerListItem } from "@/lib/content/banner-mutations";

type BannerTableProps = {
  banners: BannerListItem[];
};

export function BannerTable({ banners }: BannerTableProps) {
  if (banners.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
            <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L3 21" strokeLinecap="round" />
          </svg>
        </div>
        <p className="console-empty__title">Belum ada banner</p>
        <p className="console-empty__text">
          Tambahkan gambar slider untuk ditampilkan di beranda.
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--banners">
        <thead>
          <tr>
            <th>Banner</th>
            <th>Link</th>
            <th className="console-table__count-head">Urutan</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((banner) => (
            <tr key={banner.id}>
              <td>
                <div className="console-table__game">
                  <div className="console-table__thumb console-table__thumb--wide">
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
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
                    <p className="console-table__primary">{banner.title}</p>
                    {!banner.isActive ? (
                      <p className="console-field__hint">Nonaktif</p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td>
                {banner.href ? (
                  <code className="console-table__code">{banner.href}</code>
                ) : (
                  <span className="console-field__hint">—</span>
                )}
              </td>
              <td className="console-table__count-cell">{banner.sortOrder}</td>
              <td className="console-table__actions-cell">
                <BannerRowActions
                  bannerId={banner.id}
                  bannerTitle={banner.title}
                  isActive={banner.isActive}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
