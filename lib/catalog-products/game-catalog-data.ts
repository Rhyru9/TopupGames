import { prisma } from "@/lib/prisma";

export async function loadAllProductTypes(options?: {
  skip?: number;
  take?: number;
}) {
  const [groups, total] = await Promise.all([
    prisma.productType.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ product: { name: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        iconUrl: true,
        productId: true,
        product: { select: { id: true, name: true } },
        _count: { select: { skus: true } },
      },
    }),
    prisma.productType.count(),
  ]);

  return {
    productTypes: groups.map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      sortOrder: group.sortOrder,
      iconUrl: group.iconUrl,
      productId: group.productId,
      productName: group.product.name,
      skuCount: group._count.skus,
    })),
    total,
  };
}

export async function getProductTypeOptionsForProduct(productId: string) {
  return prisma.productType.findMany({
    where: { productId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

export async function getAllProductTypeOptions() {
  return prisma.productType.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, productId: true },
  });
}

/** @deprecated Use getProductTypeOptionsForProduct */
export const getProductKindOptionsForProduct = getProductTypeOptionsForProduct;

/** @deprecated Use getAllProductTypeOptions */
export const getAllProductKindOptions = getAllProductTypeOptions;

export async function loadProductCatalogPageData(productId: string) {
  const [product, syncProviders] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        types: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            _count: { select: { skus: true } },
          },
        },
      },
    }),
    prisma.fulfillmentProvider.findMany({
      where: { slug: { in: ["digiflazz", "melostore"] }, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true },
    }),
  ]);

  if (!product) return null;

  const productTypes = product.types.map((type) => ({
    id: type.id,
    name: type.name,
    slug: type.slug,
    sortOrder: type.sortOrder,
    iconUrl: type.iconUrl,
    skuCount: type._count.skus,
  }));

  return {
    product,
    productTypes,
    syncProviders,
  };
}

/** @deprecated Use getProductTypeOptionsForProduct */
export const getProductGroupOptionsForGame = getProductTypeOptionsForProduct;

/** @deprecated Use getAllProductTypeOptions */
export const getAllProductGroupOptions = getAllProductTypeOptions;

/** @deprecated Use loadProductCatalogPageData */
export const loadGameCatalogPageData = loadProductCatalogPageData;
