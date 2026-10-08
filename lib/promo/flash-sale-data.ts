import { ProductSkuStatus, ProductStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  FlashSaleListItem,
  FlashSaleSkuOption,
} from "@/lib/promo/flash-sale-shared";

export type {
  FlashSaleItemFormValue,
  FlashSaleListItem,
  FlashSaleSkuOption,
} from "@/lib/promo/flash-sale-shared";

export {
  flashSaleScheduleLabel,
  parseDatetimeLocal,
  toDatetimeLocalValue,
} from "@/lib/promo/flash-sale-shared";

export async function listFlashSales(options?: {
  skip?: number;
  take?: number;
}): Promise<{ rows: FlashSaleListItem[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.flashSale.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ sortOrder: "asc" }, { startsAt: "desc" }],
      include: { _count: { select: { items: true } } },
    }),
    prisma.flashSale.count(),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      isEnabled: row.isEnabled,
      sortOrder: row.sortOrder,
      itemCount: row._count.items,
    })),
    total,
  };
}

/** Campaign enabled yang sedang dalam jendela waktu (satu yang boleh “live” di storefront). */
export async function getRunningFlashSale(excludeId?: string, now = new Date()) {
  return prisma.flashSale.findFirst({
    where: {
      isEnabled: true,
      startsAt: { lte: now },
      endsAt: { gt: now },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { endsAt: "asc" }],
    select: {
      id: true,
      name: true,
      startsAt: true,
      endsAt: true,
    },
  });
}

export async function getFlashSaleForEdit(id: string) {
  return prisma.flashSale.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          productSku: {
            select: {
              id: true,
              name: true,
              priceGuest: true,
              priceMember: true,
              productId: true,
              product: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}

export async function getFlashSaleSkuOptions(
  includeSkuIds: string[] = [],
): Promise<FlashSaleSkuOption[]> {
  const rows = await prisma.productSku.findMany({
    where: {
      OR: [
        {
          status: ProductSkuStatus.AVAILABLE,
          product: { status: ProductStatus.ACTIVE },
        },
        ...(includeSkuIds.length > 0 ? [{ id: { in: includeSkuIds } }] : []),
      ],
    },
    orderBy: [{ product: { name: "asc" } }, { costPrice: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      priceGuest: true,
      priceMember: true,
      productId: true,
      product: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    priceGuest: row.priceGuest,
    priceMember: row.priceMember,
    productId: row.productId,
    productName: row.product.name,
  }));
}
