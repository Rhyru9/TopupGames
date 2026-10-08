import { ProductStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type LandingPopularProduct = {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string;
  soldCount: number;
  requiresLogin: boolean;
};

/** Produk aktif yang ditandai populer di admin, urut naik. */
export async function getPopularLandingProducts(
  limit = 12,
): Promise<LandingPopularProduct[]> {
  return prisma.product.findMany({
    where: {
      isPopular: true,
      status: ProductStatus.ACTIVE,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      thumbnailUrl: true,
      soldCount: true,
      requiresLogin: true,
    },
  });
}
