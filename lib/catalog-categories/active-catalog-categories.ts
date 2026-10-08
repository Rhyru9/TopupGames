import { prisma } from "@/lib/prisma";

export async function getActiveCatalogCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, defaultRequiresLogin: true },
  });
}

export type CatalogCategoryOption = Awaited<ReturnType<typeof getActiveCatalogCategories>>[number];

/** @deprecated Use getActiveCatalogCategories */
export const getActiveGameTypes = getActiveCatalogCategories;

/** @deprecated Use CatalogCategoryOption */
export type GameTypeOption = CatalogCategoryOption;
