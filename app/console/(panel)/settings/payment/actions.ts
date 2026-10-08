"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { assertSuperAdminAction } from "@/lib/admin/require-super";
import { withToastUrl } from "@/lib/console-toast";
import {
  getPaymentGatewayConfigSchemaOrThrow,
  mergePaymentGatewayConfig,
  parsePaymentGatewayConfigForm,
  parsePaymentGatewaySettingsForm,
  validatePaymentGatewayConfig,
  type PaymentGatewayConfigFormState,
} from "@/lib/payments/payment-gateway-mutations";
import { paymentGatewayToasts } from "@/lib/payments/payment-gateway-toasts";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { PaymentGatewayConfigFormState };

function asConfigRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function savePaymentGatewayConfig(
  _prevState: PaymentGatewayConfigFormState,
  formData: FormData,
): Promise<PaymentGatewayConfigFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const gatewayId = String(formData.get("gatewayId") ?? "").trim();
  if (!gatewayId) {
    return { error: "Payment gateway tidak valid." };
  }

  const gateway = await prisma.paymentGateway.findUnique({ where: { id: gatewayId } });
  if (!gateway) {
    return { error: "Payment gateway tidak ditemukan." };
  }

  const schema = getPaymentGatewayConfigSchemaOrThrow(gateway.slug);
  const existingConfig = asConfigRecord(gateway.config);
  const parsedConfig = parsePaymentGatewayConfigForm(formData, schema, existingConfig);
  const mergedConfig = mergePaymentGatewayConfig(gateway.config, parsedConfig);
  const validation = validatePaymentGatewayConfig(schema, mergedConfig);
  if (validation) return validation;

  const settings = parsePaymentGatewaySettingsForm(formData);

  await prisma.paymentGateway.update({
    where: { id: gatewayId },
    data: {
      config: mergedConfig as Prisma.InputJsonValue,
      sandboxMode: settings.sandboxMode,
    },
  });

  revalidatePath("/console/settings/payment");
  redirect(
    withToastUrl(
      `/console/settings/payment?gateway=${gateway.slug}`,
      paymentGatewayToasts.updated,
    ),
  );
}

export async function togglePaymentGatewayStatus(formData: FormData) {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) {
    redirect(withToastUrl("/console", gate.error, "error"));
  }

  const gatewayId = String(formData.get("gatewayId") ?? "").trim();
  if (!gatewayId) return;

  const gateway = await prisma.paymentGateway.findUnique({ where: { id: gatewayId } });
  if (!gateway) return;

  await prisma.paymentGateway.update({
    where: { id: gatewayId },
    data: { isActive: !gateway.isActive },
  });

  revalidatePath("/console/settings/payment");
  redirect(
    withToastUrl(
      `/console/settings/payment?gateway=${gateway.slug}`,
      paymentGatewayToasts.statusUpdated,
    ),
  );
}
