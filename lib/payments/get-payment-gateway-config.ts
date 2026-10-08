import { prisma } from "@/lib/prisma";
import {
  isPaymentGatewayConfigured,
  resolvePaymentGatewayApiBase,
} from "@/lib/payments/payment-gateway-schemas";

function asConfigRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

/** Ambil konfigurasi payment gateway aktif — hanya untuk server. */
export async function getPaymentGatewayConfig(slug: string) {
  const gateway = await prisma.paymentGateway.findUnique({
    where: { slug },
  });

  if (!gateway || !gateway.isActive) return null;

  const config = asConfigRecord(gateway.config);

  return {
    id: gateway.id,
    slug: gateway.slug,
    name: gateway.name,
    sandboxMode: gateway.sandboxMode,
    config,
    apiBaseUrl: resolvePaymentGatewayApiBase(gateway.slug, gateway.sandboxMode),
    isConfigured: isPaymentGatewayConfigured(gateway.slug, config),
  };
}

export async function getPaymentGatewayCallbackUrl(slug: string): Promise<string | null> {
  const { getPaymentGatewayConfigSchema } = await import(
    "@/lib/payments/payment-gateway-schemas"
  );
  const schema = getPaymentGatewayConfigSchema(slug);
  if (!schema?.webhookPath) return null;

  const { getAppUrl } = await import("@/lib/app-url");
  const base = await getAppUrl();
  return `${base}${schema.webhookPath}`;
}
