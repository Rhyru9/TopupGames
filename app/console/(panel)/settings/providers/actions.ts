"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { assertSuperAdminAction } from "@/lib/admin/require-super";
import {
  getProviderConfigSchemaOrThrow,
  mergeProviderConfig,
  parseProviderConfigForm,
  parseProviderSettingsForm,
  validateProviderConfig,
  type ProviderConfigFormState,
} from "@/lib/providers/provider-mutations";
import {
  supportsProviderBalanceSync,
  syncProviderBalance,
  type ProviderBalanceSnapshot,
} from "@/lib/providers/provider-balance-sync";
import { providerToasts } from "@/lib/providers/provider-toasts";
import { withToastUrl } from "@/lib/console-toast";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { ProviderConfigFormState };

export type ProviderBalanceActionState = {
  error?: string;
  balance?: ProviderBalanceSnapshot;
};

export type ProviderOutboundIpState = {
  ip?: string;
  error?: string;
};

export async function getProviderOutboundIp(): Promise<ProviderOutboundIpState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const { getServerOutboundIp } = await import("@/lib/providers/get-server-outbound-ip");
  const result = await getServerOutboundIp();
  if (!result.ok) {
    return { error: result.error };
  }
  return { ip: result.ip };
}

function asConfigRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function saveProviderConfig(
  _prevState: ProviderConfigFormState,
  formData: FormData,
): Promise<ProviderConfigFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };
  const providerId = String(formData.get("providerId") ?? "").trim();
  if (!providerId) {
    return { error: "Provider tidak valid." };
  }

  const provider = await prisma.fulfillmentProvider.findUnique({ where: { id: providerId } });
  if (!provider) {
    return { error: "Provider tidak ditemukan." };
  }

  const schema = getProviderConfigSchemaOrThrow(provider.slug);
  const existingConfig = asConfigRecord(provider.config);
  const parsedConfig = parseProviderConfigForm(formData, schema, existingConfig);
  const mergedConfig = mergeProviderConfig(provider.config, parsedConfig);
  const validation = validateProviderConfig(schema, mergedConfig);
  if (validation) return validation;

  const settings = parseProviderSettingsForm(formData);

  await prisma.fulfillmentProvider.update({
    where: { id: providerId },
    data: {
      config: mergedConfig as Prisma.InputJsonValue,
      sandboxMode: settings.sandboxMode,
    },
  });

  if (supportsProviderBalanceSync(provider.slug)) {
    await syncProviderBalance(providerId, { force: true });
  }

  revalidatePath("/console/settings/providers");
  revalidatePath("/console/product-skus");
  redirect(
    withToastUrl(
      `/console/settings/providers?provider=${provider.slug}`,
      providerToasts.updated,
    ),
  );
}

export async function toggleProviderStatus(formData: FormData) {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) {
    redirect(withToastUrl("/console", gate.error, "error"));
  }

  const providerId = String(formData.get("providerId") ?? "");
  if (!providerId) return;

  const provider = await prisma.fulfillmentProvider.findUnique({
    where: { id: providerId },
    include: { _count: { select: { productSkus: true } } },
  });
  if (!provider) return;

  if (provider.isActive && provider._count.productSkus > 0) {
    return;
  }

  await prisma.fulfillmentProvider.update({
    where: { id: providerId },
    data: { isActive: !provider.isActive },
  });

  revalidatePath("/console/settings/providers");
  revalidatePath("/console/product-skus");
  redirect(
    withToastUrl(
      `/console/settings/providers?provider=${provider.slug}`,
      providerToasts.statusUpdated,
    ),
  );
}

export async function refreshProviderBalance(
  _prevState: ProviderBalanceActionState,
  formData: FormData,
): Promise<ProviderBalanceActionState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const providerId = String(formData.get("providerId") ?? "").trim();

  if (!providerId) {
    return { error: "Provider tidak valid." };
  }

  const provider = await prisma.fulfillmentProvider.findUnique({
    where: { id: providerId },
    select: { id: true, slug: true },
  });

  if (!provider) {
    return { error: "Provider tidak ditemukan." };
  }

  if (!supportsProviderBalanceSync(provider.slug)) {
    return { error: "Provider ini belum mendukung sync saldo." };
  }

  const result = await syncProviderBalance(providerId, { force: true });
  revalidatePath("/console/settings/providers");

  if (!result.ok) {
    return {
      error: result.error,
      balance: result.balance,
    };
  }

  return { balance: result.balance };
}
