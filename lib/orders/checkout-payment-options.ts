import { getOrCreateMemberBalance } from "@/lib/member/member-balance";
import { computeCheckoutWalletUsage } from "@/lib/member/order-wallet";
import { resolveCheckoutPricing } from "@/lib/promo/resolve-checkout-pricing";
import { getMemberSession } from "@/lib/member-auth";
import { listConfiguredDokuChannels } from "@/lib/payments/doku";
import { listDokuChannelsWithFees } from "@/lib/payments/doku-channels";
import type { PaymentPricedChannel } from "@/lib/payments/payment-channel-types";

export type CheckoutMemberWallet = {
  saldo: number;
  poin: number;
};

export type CheckoutPaymentOptions = {
  itemSubtotal: number;
  voucherCode: string | null;
  voucherDiscount: number;
  priceSnapshot: number;
  productName: string;
  skuName: string;
  channels: PaymentPricedChannel[];
  wallet: CheckoutMemberWallet | null;
  poinPreview: {
    poinUsed: number;
    remainingAfterPoin: number;
    canPayWithSaldo: boolean;
  } | null;
  voucherError: string | null;
  channelError: string | null;
};

export async function loadCheckoutPaymentOptions(input: {
  productId: string;
  productSkuId: string;
  usePoin?: boolean;
  voucherCode?: string;
  email?: string;
  accountValues?: Record<string, string>;
}): Promise<{ ok: true; data: CheckoutPaymentOptions } | { ok: false; error: string }> {
  const memberSession = await getMemberSession();
  const memberId = memberSession?.user?.id ?? null;
  const isMember = Boolean(memberId);

  const priced = await resolveCheckoutPricing({
    productId: input.productId,
    productSkuId: input.productSkuId,
    isMember,
    voucherCode: input.voucherCode,
    memberId,
    email: input.email,
    accountValues: input.accountValues,
  });

  let voucherError: string | null = null;
  let pricing = priced;

  if (!priced.ok && input.voucherCode?.trim()) {
    voucherError = priced.error;
    const fallback = await resolveCheckoutPricing({
      productId: input.productId,
      productSkuId: input.productSkuId,
      isMember,
      memberId,
      email: input.email,
      accountValues: input.accountValues,
    });
    if (!fallback.ok) return fallback;
    pricing = fallback;
  } else if (!priced.ok) {
    return priced;
  }

  if (!pricing.ok) {
    return pricing;
  }

  const data = pricing.data;

  if (data.requiresLogin && !isMember) {
    return { ok: false, error: "Produk ini wajib login member." };
  }

  let wallet: CheckoutMemberWallet | null = null;
  let poinPreview: CheckoutPaymentOptions["poinPreview"] = null;
  let feeBase = data.priceSnapshot;

  if (isMember && memberId) {
    const balance = await getOrCreateMemberBalance(memberId);
    wallet = { saldo: balance.saldo, poin: balance.poin };
    const usage = computeCheckoutWalletUsage({
      priceSnapshot: data.priceSnapshot,
      usePoin: Boolean(input.usePoin),
      useSaldo: false,
      poinBalance: balance.poin,
      saldoBalance: balance.saldo,
    });
    poinPreview = {
      poinUsed: usage.poinUsed,
      remainingAfterPoin: usage.remainingAfterPoin,
      canPayWithSaldo: usage.canPayWithSaldo || balance.saldo >= usage.remainingAfterPoin,
    };
    if (usage.remainingAfterPoin === 0) {
      poinPreview.canPayWithSaldo = false;
    } else {
      poinPreview.canPayWithSaldo = balance.saldo >= usage.remainingAfterPoin;
    }
    feeBase = usage.remainingAfterPoin > 0 ? usage.remainingAfterPoin : data.priceSnapshot;
  }

  let channels: PaymentPricedChannel[] = [];
  let channelError: string | null = null;
  if (feeBase >= 1) {
    const listed = await listConfiguredDokuChannels();
    if (listed.ok) {
      channels = listDokuChannelsWithFees(feeBase);
    } else {
      channelError = listed.error;
    }
  }

  return {
    ok: true,
    data: {
      itemSubtotal: data.itemSubtotal,
      voucherCode: data.voucherCode,
      voucherDiscount: data.voucherDiscount,
      priceSnapshot: data.priceSnapshot,
      productName: data.productName,
      skuName: data.skuName,
      channels,
      wallet,
      poinPreview,
      voucherError,
      channelError,
    },
  };
}

/** @deprecated Use resolveCheckoutPricing — kept for imports during transition. */
export async function resolveCheckoutSkuPrice(options: {
  productId: string;
  productSkuId: string;
  isMember: boolean;
}) {
  const result = await resolveCheckoutPricing({
    productId: options.productId,
    productSkuId: options.productSkuId,
    isMember: options.isMember,
  });
  if (!result.ok) return result;
  return {
    ok: true as const,
    priceSnapshot: result.data.priceSnapshot,
    productName: result.data.productName,
    skuName: result.data.skuName,
    requiresLogin: result.data.requiresLogin,
  };
}
