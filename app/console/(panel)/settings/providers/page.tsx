import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ProviderSettingsPanel } from "@/components/console/providers/provider-settings-panel";
import { toProviderBalanceSnapshot } from "@/lib/providers/provider-balance-sync";
import { prisma } from "@/lib/prisma";

type ProvidersSettingsPageProps = {
  searchParams: Promise<{ provider?: string }>;
};

export default async function ProvidersSettingsPage({ searchParams }: ProvidersSettingsPageProps) {
  const { provider: providerSlug } = await searchParams;

  const rows = await prisma.fulfillmentProvider.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      docsUrl: true,
      sandboxMode: true,
      isActive: true,
      supportsCatalogSync: true,
      config: true,
      balanceAmount: true,
      balanceCurrency: true,
      balanceLabel: true,
      balanceSyncedAt: true,
      balanceSyncError: true,
      _count: { select: { productSkus: true } },
    },
  });

  const providers = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    docsUrl: row.docsUrl,
    sandboxMode: row.sandboxMode,
    isActive: row.isActive,
    supportsCatalogSync: row.supportsCatalogSync,
    config: row.config,
    skuCount: row._count.productSkus,
    balance: toProviderBalanceSnapshot(row),
  }));

  const selectedSlug =
    providerSlug && providers.some((item) => item.slug === providerSlug)
      ? providerSlug
      : (providers[0]?.slug ?? "");

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Pengaturan"
        title="Provider Fulfillment"
        description="Konfigurasi kredensial API supplier H2H. Pilih provider di kiri, isi kredensial di kanan."
      />

      <ProviderSettingsPanel providers={providers} selectedSlug={selectedSlug} />
    </div>
  );
}
