import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/catalog/category-icon";
import { isIconifyIconId } from "@/lib/catalog-categories/iconify-icon";
import { GameTypeRowActions } from "./game-type-row-actions";

type GameTypeRow = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  defaultRequiresLogin: boolean;
  _count: { products: number };
};

type GameTypeTableProps = {
  categories: GameTypeRow[];
};

export function GameTypeTable({ categories }: GameTypeTableProps) {
  if (categories.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 7h16M4 12h10M4 17h16" strokeLinecap="round" />
          </svg>
        </div>
        <p className="console-empty__title">Belum ada kategori</p>
        <p className="console-empty__text">
          Tambahkan jenis katalog seperti Topup Game, Voucher, Pulsa &amp; Data.
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--categories">
        <thead>
          <tr>
            <th className="console-table__name-head">Kategori</th>
            <th>Slug</th>
            <th className="console-table__count-head">Produk</th>
            <th className="console-table__count-head">Urutan</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>
                <div className="console-table__game">
                  <div className="console-table__thumb console-table__thumb--icon">
                    {category.iconUrl && isIconifyIconId(category.iconUrl) ? (
                      <CategoryIcon
                        icon={category.iconUrl}
                        name={category.name}
                        className="console-table__thumb-icon"
                        size={20}
                      />
                    ) : category.iconUrl && /^https?:\/\//i.test(category.iconUrl) ? (
                      <Image
                        src={category.iconUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="console-table__thumb-img"
                      />
                    ) : (
                      <CategoryIcon
                        icon={null}
                        name={category.name}
                        className="console-table__thumb-icon"
                        size={20}
                      />
                    )}
                  </div>
                  <div className="console-table__game-meta">
                    <p className="console-table__primary">{category.name}</p>
                    {category.defaultRequiresLogin ? (
                      <p className="console-field__hint">Default wajib login</p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td>
                <code className="console-table__code">{category.slug}</code>
              </td>
              <td className="console-table__count-cell">
                <Link href="/console/produk" className="console-table__link">
                  {category._count.products}
                </Link>
              </td>
              <td className="console-table__count-cell">{category.sortOrder}</td>
              <td className="console-table__actions-cell">
                <GameTypeRowActions
                  categoryId={category.id}
                  categoryName={category.name}
                  productCount={category._count.products}
                  isActive={category.isActive}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
