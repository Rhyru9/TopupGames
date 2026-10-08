import { ProductSkuStatus, ProductStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type LandingCatalogCategory = {
  id: string;
  slug: string;
  name: string;
  iconUrl: string | null;
};

export type LandingCatalogProduct = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  thumbnailUrl: string;
  categoryId: string;
  soldCount: number;
  requiresLogin: boolean;
  /** Harga guest terendah SKU AVAILABLE; null jika belum ada SKU. */
  startingPrice: number | null;
};

export type LandingCatalog = {
  categories: LandingCatalogCategory[];
  products: LandingCatalogProduct[];
};

/** Kategori aktif + produk ACTIVE untuk section katalog homepage. */
export async function getLandingCatalog(): Promise<LandingCatalog> {
  const [categories, products, skuRows] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true, iconUrl: true },
    }),
    prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        subtitle: true,
        thumbnailUrl: true,
        categoryId: true,
        soldCount: true,
        requiresLogin: true,
      },
    }),
    prisma.productSku.findMany({
      where: { status: ProductSkuStatus.AVAILABLE },
      select: { productId: true, priceGuest: true },
    }),
  ]);

  const minPriceByProduct = new Map<string, number>();
  for (const row of skuRows) {
    const current = minPriceByProduct.get(row.productId);
    if (current === undefined || row.priceGuest < current) {
      minPriceByProduct.set(row.productId, row.priceGuest);
    }
  }

  const enrichedProducts: LandingCatalogProduct[] = products.map((product) => ({
    ...product,
    startingPrice: minPriceByProduct.get(product.id) ?? null,
  }));

  const productCategoryIds = new Set(enrichedProducts.map((product) => product.categoryId));
  const categoriesWithProducts = categories.filter((category) =>
    productCategoryIds.has(category.id),
  );

  return {
    categories: categoriesWithProducts,
    products: enrichedProducts,
  };
}
