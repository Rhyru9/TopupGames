import Image from "next/image";
import { ArticleRowActions } from "./article-row-actions";
import type { ArticleListItem } from "@/lib/article/article-mutations";

type ArticleTableProps = {
  items: ArticleListItem[];
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function ArticleTable({ items }: ArticleTableProps) {
  if (items.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M6 4h12v16H6z" strokeLinejoin="round" />
            <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
          </svg>
        </div>
        <p className="console-empty__title">Belum ada artikel</p>
        <p className="console-empty__text">
          Tulis artikel dengan cover dan meta SEO untuk mendukung traffic organik.
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th>Artikel</th>
            <th>Slug</th>
            <th>Publikasi</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="console-table__game">
                  <div className="console-table__thumb console-table__thumb--wide">
                    {item.coverImageUrl ? (
                      <Image
                        src={item.coverImageUrl}
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
                      {item.isActive ? "Aktif" : "Draft"}
                      {item.isActive ? ` · ${item.excerpt.slice(0, 60)}` : " · Tidak tampil di publik"}
                    </p>
                  </div>
                </div>
              </td>
              <td>
                <code className="console-table__code">/artikel/{item.slug}</code>
              </td>
              <td>{formatDate(item.publishedAt)}</td>
              <td className="console-table__actions-cell">
                <ArticleRowActions
                  articleId={item.id}
                  articleTitle={item.title}
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
