import { ContentPageRowActions } from "./content-page-row-actions";
import type { ContentPageListItem } from "@/lib/content/content-page-mutations";

type ContentPageTableProps = {
  items: ContentPageListItem[];
};

export function ContentPageTable({ items }: ContentPageTableProps) {
  if (items.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M6 4h12v16H6z" strokeLinejoin="round" />
            <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
          </svg>
        </div>
        <p className="console-empty__title">Belum ada halaman</p>
        <p className="console-empty__text">
          Tambahkan halaman statis untuk footer dan kebutuhan legal/info situs.
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th>Halaman</th>
            <th>Slug</th>
            <th className="console-table__count-head">Urutan</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <p className="console-table__primary">{item.title}</p>
                <p className="console-field__hint">
                  {!item.isActive ? "Nonaktif" : null}
                  {!item.isActive && !item.showInFooter ? " · " : null}
                  {!item.showInFooter ? "Sembunyi di footer" : null}
                  {item.isActive && item.showInFooter ? "Aktif di footer" : null}
                </p>
              </td>
              <td>
                <code className="console-table__code">/halaman/{item.slug}</code>
              </td>
              <td className="console-table__count-cell">{item.sortOrder}</td>
              <td className="console-table__actions-cell">
                <ContentPageRowActions
                  pageId={item.id}
                  pageTitle={item.title}
                  isActive={item.isActive}
                  showInFooter={item.showInFooter}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
