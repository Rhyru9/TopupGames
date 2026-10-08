import { prisma } from "@/lib/prisma";
import { isProviderConfigured } from "@/lib/providers/provider-schemas";
import { resolveProviderApiUrl } from "@/lib/providers/provider-api-urls";

function asConfigRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

/** Ambil konfigurasi provider aktif dari DB — hanya untuk server/worker. */
export async function getFulfillmentProviderConfig(slug: string) {
  const provider = await prisma.fulfillmentProvider.findUnique({
    where: { slug },
  });

  if (!provider || !provider.isActive) return null;

  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    sandboxMode: provider.sandboxMode,
    config: asConfigRecord(provider.config),
    apiUrl: resolveProviderApiUrl(provider.slug, asConfigRecord(provider.config), provider.sandboxMode),
    isConfigured: isProviderConfigured(provider.slug, asConfigRecord(provider.config)),
  };
}
