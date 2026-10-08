import { ProductStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ProductOption = {
  id: string;
  name: string;
};

/** @deprecated Use ProductOption */
export type GameOption = ProductOption;

export async function getProductOptionsForSku(currentProductId?: string): Promise<ProductOption[]> {
  return prisma.product.findMany({
    where: currentProductId
      ? { OR: [{ status: ProductStatus.ACTIVE }, { id: currentProductId }] }
      : { status: ProductStatus.ACTIVE },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

/** @deprecated Use getProductOptionsForSku */
export const getGameOptionsForProduct = getProductOptionsForSku;
