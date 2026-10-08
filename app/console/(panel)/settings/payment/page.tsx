import { ConsolePageHeader } from "@/components/console/console-page-header";
import { PaymentGatewaySettingsPanel } from "@/components/console/payment-gateways/payment-gateway-settings-panel";
import { prisma } from "@/lib/prisma";

type PaymentSettingsPageProps = {
  searchParams: Promise<{ gateway?: string }>;
};

export default async function PaymentSettingsPage({ searchParams }: PaymentSettingsPageProps) {
  const { gateway: gatewaySlug } = await searchParams;

  const rows = await prisma.paymentGateway.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      docsUrl: true,
      sandboxMode: true,
      isActive: true,
      config: true,
    },
  });

  const gateways = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    docsUrl: row.docsUrl,
    sandboxMode: row.sandboxMode,
    isActive: row.isActive,
    config: row.config,
  }));

  const selectedSlug =
    gatewaySlug && gateways.some((item) => item.slug === gatewaySlug)
      ? gatewaySlug
      : (gateways[0]?.slug ?? "");

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Pengaturan"
        title="Payment Gateway"
        description="Konfigurasi kredensial DOKU Checkout. Isi Client ID dan Secret Key, lalu aktifkan gateway."
      />

      <PaymentGatewaySettingsPanel gateways={gateways} selectedSlug={selectedSlug} />
    </div>
  );
}
