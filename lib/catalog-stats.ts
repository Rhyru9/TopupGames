import { prisma } from "@/lib/prisma";

export async function getCatalogStats() {
  const [totalProducts, totalProductSkus] = await Promise.all([
    prisma.product.count(),
    prisma.productSku.count(),
  ]);

  return { totalProducts, totalProductSkus };
}
