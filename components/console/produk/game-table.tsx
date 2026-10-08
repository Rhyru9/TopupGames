import Image from "next/image";
import Link from "next/link";
import { ProductStatus } from "@/app/generated/prisma/client";
import { GameRowActions } from "./game-row-actions";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  isPopular: boolean;
  status: ProductStatus;
  thumbnailUrl: string;
  sortOrder: number;
  category: { name: string };
  _count: { skus: number };
};

type GameTableProps = {
  products: ProductRow[];
};

export function GameTable({ products }: GameTableProps) {
  if (products.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="4" y="4" width="16" height="6" rx="1.5" />
            <rect x="4" y="14" width="16" height="6" rx="1.5" />
          </svg>
        </div>
        <p className="console-empty__title">Belum ada produk</p>
        <p className="console-empty__text">Tambahkan produk pertama untuk mulai mengisi katalog.</p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--games">
        <thead>
          <tr>
            <th className="console-table__game-head">Produk</th>
            <th>Slug</th>
            <th>Kategori</th>
            <th className="console-table__count-head">SKU</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="console-table__game">
                  <div className="console-table__thumb">
                    {product.thumbnailUrl ? (
                      <Image
                        src={product.thumbnailUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="console-table__thumb-img"
                      />
                    ) : (
                      <span className="console-table__thumb-fallback" aria-hidden />
                    )}
                  </div>
                  <div className="console-table__game-meta">
                    <p className="console-table__primary">{product.name}</p>
                    <p className="console-table__muted">Urutan {product.sortOrder}</p>
                  </div>
                </div>
              </td>
              <td>
                <code className="console-table__code">{product.slug}</code>
              </td>
              <td>
                <span className="console-table__cell-text">{product.category.name}</span>
              </td>
              <td className="console-table__count-cell">
                <Link href={`/console/product-skus?productId=${product.id}`} className="console-table__link">
                  {product._count.skus}
                </Link>
              </td>
              <td className="console-table__actions-cell">
                <GameRowActions
                  productId={product.id}
                  productName={product.name}
                  isPopular={product.isPopular}
                  isActive={product.status === ProductStatus.ACTIVE}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
