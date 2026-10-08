"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/catalog/category-icon";
import type {
  LandingCatalog,
  LandingCatalogCategory,
  LandingCatalogProduct,
} from "@/lib/catalog-products/get-landing-catalog";
import { catalogPageSize, gridColsClass } from "@/lib/site-settings/grid-cols-class";
import type { SiteStyleSettings } from "@/lib/site-settings/site-settings-schemas";
import { CatalogCategoryChips } from "./catalog-category-chips";
import { ProductGridCard } from "./product-grid-card";

function CatalogCategoryBlock({
  category,
  products,
  visibleCount,
  gridClass,
  showTitle,
  showStartingPrice,
  onShowMore,
}: {
  category: LandingCatalogCategory;
  products: LandingCatalogProduct[];
  visibleCount: number;
  gridClass: string;
  showTitle: boolean;
  showStartingPrice: boolean;
  onShowMore?: () => void;
}) {
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = products.length > visibleCount;

  return (
    <div className="catalog-neon__group">
      {showTitle ? (
        <h3 className="catalog-neon__group-title">
          <CategoryIcon
            icon={category.iconUrl}
            name={category.name}
            className="catalog-neon__group-icon"
            size={14}
          />
          {category.name}
        </h3>
      ) : null}
      <div className={gridClass}>
        {visibleProducts.map((product, index) => (
          <ProductGridCard
            key={product.id}
            product={product}
            index={index}
            showStartingPrice={showStartingPrice}
          />
        ))}
      </div>
      {hasMore && onShowMore ? (
        <button type="button" className="catalog-neon__more" onClick={onShowMore}>
          Tampilkan lebih banyak
        </button>
      ) : null}
    </div>
  );
}

export function CatalogProductGrid({
  catalog,
  style,
  mode = "preview",
  sectionId,
  showHeader = true,
  showStartingPrice,
}: {
  catalog: LandingCatalog;
  style: SiteStyleSettings["catalog"];
  mode?: "preview" | "full";
  sectionId?: string;
  showHeader?: boolean;
  showStartingPrice?: boolean;
}) {
  const { categories, products } = catalog;
  const pageSize = catalogPageSize(style.columns.desktop, style.pageRows);
  const gridClass = gridColsClass(style.columns, style.gap);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [visibleByCategory, setVisibleByCategory] = useState<Record<string, number>>({});

  const displayStartingPrice = showStartingPrice ?? mode === "full";

  if (products.length === 0) return null;

  const productsByCategoryId = new Map<string, LandingCatalogProduct[]>();
  for (const product of products) {
    const list = productsByCategoryId.get(product.categoryId);
    if (list) list.push(product);
    else productsByCategoryId.set(product.categoryId, [product]);
  }

  const visibleGroups =
    activeCategoryId === "all"
      ? categories
      : categories.filter((category) => category.id === activeCategoryId);

  function visibleCountFor(categoryId: string, groupSize: number) {
    if (mode === "full") return groupSize;
    return visibleByCategory[categoryId] ?? pageSize;
  }

  function showMore(categoryId: string) {
    setVisibleByCategory((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] ?? pageSize) + pageSize,
    }));
  }

  function selectCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    setVisibleByCategory({});
  }

  return (
    <section
      id={sectionId}
      className={sectionId ? "mx-auto max-w-[1400px] px-4 pt-10 pb-16" : undefined}
    >
      {showHeader ? (
        <div className="catalog-neon__head">
          <p className="catalog-neon__eyebrow">
            <span className="catalog-neon__eyebrow-line" aria-hidden />
            Katalog produk
            <span className="catalog-neon__eyebrow-line" aria-hidden />
          </p>
          <div className="catalog-neon__title-row">
            <h2 className="catalog-neon__title">
              <span className="catalog-neon__title-chrome">Pilih</span>{" "}
              <span className="catalog-neon__title-neon">produk</span>
            </h2>

            <CatalogCategoryChips
              categories={categories}
              activeCategoryId={activeCategoryId}
              onSelect={selectCategory}
            />
          </div>
        </div>
      ) : (
        <CatalogCategoryChips
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelect={selectCategory}
        />
      )}

      {visibleGroups.length === 0 ? (
        <p className="catalog-neon__empty">Belum ada produk di kategori ini.</p>
      ) : (
        <div className="catalog-neon__groups">
          {visibleGroups.map((category) => {
            const groupProducts = productsByCategoryId.get(category.id) ?? [];
            if (groupProducts.length === 0) return null;

            return (
              <CatalogCategoryBlock
                key={category.id}
                category={category}
                products={groupProducts}
                visibleCount={visibleCountFor(category.id, groupProducts.length)}
                gridClass={gridClass}
                showTitle={showHeader}
                showStartingPrice={displayStartingPrice}
                onShowMore={mode === "preview" ? () => showMore(category.id) : undefined}
              />
            );
          })}
        </div>
      )}

    </section>
  );
}
