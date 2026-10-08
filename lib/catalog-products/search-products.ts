import { ProductStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ProductSearchHit = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  thumbnailUrl: string;
  categoryName: string;
  requiresLogin: boolean;
};

export async function searchActiveProducts(query: string, limit = 6): Promise<ProductSearchHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const rows = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      OR: [
        { name: { contains: q } },
        { subtitle: { contains: q } },
        { slug: { contains: q } },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: Math.min(Math.max(limit, 1), 12),
    select: {
      id: true,
      slug: true,
      name: true,
      subtitle: true,
      thumbnailUrl: true,
      requiresLogin: true,
      category: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    thumbnailUrl: row.thumbnailUrl,
    categoryName: row.category.name,
    requiresLogin: row.requiresLogin,
  }));
}
