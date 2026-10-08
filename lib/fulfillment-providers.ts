import { prisma } from "@/lib/prisma";
import { isProviderConfigured } from "@/lib/providers/provider-schemas";

function asConfigRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

/** Provider sync: aktif, flag supportsCatalogSync, dan kredensial lengkap. */
export async function getConfiguredSyncProviders() {
  const rows = await prisma.fulfillmentProvider.findMany({
    where: {
      isActive: true,
      supportsCatalogSync: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, config: true, docsUrl: true },
  });

  return rows
    .filter((row) => isProviderConfigured(row.slug, asConfigRecord(row.config)))
    .map(({ id, slug, name, docsUrl }) => ({ id, slug, name, docsUrl }));
}

export async function getActiveFulfillmentProviders() {
  return prisma.fulfillmentProvider.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true },
  });
}

export async function getFulfillmentProvidersForProduct(currentProviderId?: string) {
  return prisma.fulfillmentProvider.findMany({
    where: currentProviderId
      ? { OR: [{ isActive: true }, { id: currentProviderId }] }
      : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true },
  });
}

export type FulfillmentProviderOption = Awaited<
  ReturnType<typeof getActiveFulfillmentProviders>
>[number];
