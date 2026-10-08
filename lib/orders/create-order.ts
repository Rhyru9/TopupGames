import { checkoutIdentity } from "@/lib/orders/checkout-idempotency";
import { reserveFlashSaleInTx } from "@/lib/orders/flash-sale-reservation";
import {
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  ProductSkuStatus,
  ProductStatus,
} from "@/app/generated/prisma/client";
import { getAppUrl } from "@/lib/app-url";
import { resolveGameInputFields } from "@/lib/catalog-products/game-input-fields";
import { getOrCreateMemberBalance } from "@/lib/member/member-balance";
import {
  computeCheckoutWalletUsage,
  debitOrderWalletInTx,
} from "@/lib/member/order-wallet";
import { creditOrderCashbackInTx } from "@/lib/orders/credit-order-cashback";
import {
  notifyOrderCreated,
  notifyOrderPaid,
} from "@/lib/mail/transaction-notifications";
import { enqueueProcessTopup } from "@/lib/orders/enqueue-fulfillment";
import { normalizeEmail, normalizeWhatsapp } from "@/lib/orders/order-helpers";
import { allocateUniqueTransactionId } from "@/lib/transaction-id";
import { pickPlayerFieldsForOrder } from "@/lib/orders/player-fields";
import { prisma } from "@/lib/prisma";
import { resolveCheckoutPricing } from "@/lib/promo/resolve-checkout-pricing";
import { buildVoucherTargetKey } from "@/lib/promo/guest-voucher-key";
import { normalizeVoucherCode } from "@/lib/promo/voucher-shared";
import { reserveVoucherRedemptionInTx } from "@/lib/promo/voucher-redemption";
import { closeUnpaidOrderInTx } from "@/lib/orders/close-unpaid-order";
import { getPaymentGatewayConfig } from "@/lib/payments/get-payment-gateway-config";
import { createDokuCheckoutPayment, listConfiguredDokuChannels } from "@/lib/payments/doku";
import { persistDokuPayment } from "@/lib/payments/doku-settlement";

export type CreateOrderInput = {
  idempotencyKey: string;
  productId: string;
  productSkuId: string;
  /** Kode metode DOKU, diabaikan jika bayar penuh saldo / voucher gratis. */
  paymentChannel: string;
  accountValues: Record<string, string>;
  email?: string;
  whatsapp?: string;
  nickname?: string | null;
  memberId?: string | null;
  isMember?: boolean;
  usePoin?: boolean;
  useSaldo?: boolean;
  voucherCode?: string;
};

export type CreateOrderResult =
  | { ok: true; orderCode: string }
  | { ok: false; error: string };

async function allocateOrderCode(): Promise<string> {
  return allocateUniqueTransactionId();
}

function pricingOrderFields(pricing: {
  itemSubtotal: number;
  voucherCode: string | null;
  voucherDiscount: number;
  priceSnapshot: number;
}) {
  return {
    itemSubtotalSnapshot: pricing.itemSubtotal,
    voucherCodeSnapshot: pricing.voucherCode,
    voucherDiscountSnapshot: pricing.voucherDiscount,
    priceSnapshot: pricing.priceSnapshot,
  };
}

async function finalizePaidOrder(orderId: string, orderCode: string) {
  void notifyOrderPaid(orderId).catch((err) =>
    console.error("[mail] order paid notify failed", orderCode, err),
  );
  void enqueueProcessTopup(orderId, "paid").catch((err) =>
    console.error("[fulfillment] enqueue failed", orderCode, err),
  );
}

export async function createOrderWithDoku(input: CreateOrderInput): Promise<CreateOrderResult> {
  let identity: ReturnType<typeof checkoutIdentity>;
  try { identity = checkoutIdentity(input); }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Checkout tidak valid." }; }
  const replay = async (): Promise<CreateOrderResult | null> => {
    const existing = await prisma.order.findUnique({
      where: { checkoutKey: identity.checkoutKey },
      select: { orderCode: true, checkoutFingerprint: true },
    });
    if (!existing) return null;
    return existing.checkoutFingerprint === identity.checkoutFingerprint
      ? { ok: true, orderCode: existing.orderCode }
      : { ok: false, error: "Sesi checkout sudah dipakai untuk pesanan lain. Ulangi dari halaman produk." };
  };
  const existing = await replay();
  if (existing) return existing;
  const result = await createOrderOnce(input, identity);
  // A concurrent INSERT of the same unique key waits for the winner's commit.
  // The loser reuses that invoice; it never calls DOKU or debits again.
  return result.ok ? result : (await replay()) ?? result;
}

async function createOrderOnce(
  input: CreateOrderInput,
  identity: ReturnType<typeof checkoutIdentity>,
): Promise<CreateOrderResult> {
  const email = normalizeEmail(input.email ?? "");
  if (!email) {
    return { ok: false, error: "Email wajib diisi." };
  }
  const whatsapp = normalizeWhatsapp(input.whatsapp ?? "") ?? "";
  const voucherCode = input.voucherCode?.trim()
    ? normalizeVoucherCode(input.voucherCode)
    : "";

  const product = await prisma.product.findFirst({
    where: { id: input.productId, status: ProductStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      requiresLogin: true,
      inputFields: true,
      requiresZone: true,
    },
  });
  if (!product) return { ok: false, error: "Produk tidak ditemukan atau nonaktif." };

  if (product.requiresLogin && !input.memberId) {
    return { ok: false, error: "Produk ini wajib login member." };
  }

  const sku = await prisma.productSku.findFirst({
    where: {
      id: input.productSkuId,
      productId: product.id,
      status: ProductSkuStatus.AVAILABLE,
    },
    select: {
      id: true,
      name: true,
      priceGuest: true,
      priceMember: true,
      cashbackPoin: true,
      providerSku: true,
      provider: { select: { slug: true } },
    },
  });
  if (!sku) return { ok: false, error: "Nominal tidak tersedia." };

  const fieldsConfig = resolveGameInputFields(product.inputFields, product.requiresZone);
  for (const field of fieldsConfig.fields) {
    const value = String(input.accountValues[field.key] ?? "").trim();
    if (field.required && !value) {
      return { ok: false, error: `${field.label} wajib diisi.` };
    }
    if (field.type === "select" && field.options?.length && value) {
      if (!field.options.some((opt) => opt.value === value)) {
        return { ok: false, error: `${field.label} tidak valid.` };
      }
    }
  }

  const isMember = Boolean(input.isMember && input.memberId);
  const voucherTargetKey = buildVoucherTargetKey(
    input.accountValues,
    product.inputFields,
    product.requiresZone,
  );
  const pricingResult = await resolveCheckoutPricing({
    productId: product.id,
    productSkuId: sku.id,
    isMember,
    voucherCode: voucherCode || undefined,
    memberId: input.memberId,
    email,
    accountValues: input.accountValues,
  });
  if (!pricingResult.ok) return { ok: false, error: pricingResult.error };

  const pricing = pricingResult.data;
  const priceSnapshot = pricing.priceSnapshot;

  let poinBalance = 0;
  let saldoBalance = 0;
  if (isMember && input.memberId) {
    const balance = await getOrCreateMemberBalance(input.memberId);
    poinBalance = balance.poin;
    saldoBalance = balance.saldo;
  }

  const wantPoin = Boolean(isMember && input.usePoin);
  const wantSaldo = Boolean(isMember && input.useSaldo);

  const wallet = computeCheckoutWalletUsage({
    priceSnapshot,
    usePoin: wantPoin,
    useSaldo: wantSaldo,
    poinBalance,
    saldoBalance,
  });

  if (wantSaldo && !wallet.payWithSaldo && priceSnapshot > 0) {
    return {
      ok: false,
      error: `Saldo tidak cukup. Butuh ${wallet.remainingAfterPoin.toLocaleString("id-ID")}, saldo Anda ${saldoBalance.toLocaleString("id-ID")}.`,
    };
  }

  const { playerFields, playerLabel } = pickPlayerFieldsForOrder(input.accountValues);
  const nickname = input.nickname?.trim() || null;
  const orderCode = await allocateOrderCode();
  const cashbackPoinSnapshot = Math.max(0, sku.cashbackPoin);
  const orderPricing = pricingOrderFields(pricing);

  const settleWithWallet =
    priceSnapshot > 0 &&
    (wallet.payWithSaldo || (wallet.gatewayAmount === 0 && wallet.poinUsed >= priceSnapshot));

  const isFreeOrder = priceSnapshot === 0;

  // —— Gratis penuh (voucher 100% / nominal penuh) ——
  if (isFreeOrder) {
    try {
      await prisma.$transaction(async (tx) => {
        await reserveFlashSaleInTx(tx, { ...pricing, isMember });
        const order = await tx.order.create({
          data: {
            orderCode,
            ...identity,
            flashSaleItemId: pricing.flashSaleItemId,
            providerRefId: orderCode,
            memberId: input.memberId ?? null,
            productId: product.id,
            productSkuId: sku.id,
            productNameSnapshot: product.name,
            skuNameSnapshot: sku.name,
            ...orderPricing,
            feeSnapshot: 0,
            amount: 0,
            playerLabel,
            playerNickname: nickname,
            playerFields,
            email,
            whatsapp: whatsapp || null,
            paymentStatus: OrderPaymentStatus.PAID,
            fulfillmentStatus: OrderFulfillmentStatus.QUEUED,
            providerSlug: sku.provider.slug,
            providerSkuSnapshot: sku.providerSku,
            wallet: {
              create: {
                poinUsed: 0,
                saldoUsed: 0,
                cashbackPoinSnapshot,
              },
            },
          },
        });

        if (voucherCode) {
          await reserveVoucherRedemptionInTx(tx, {
            voucherCode,
            orderId: order.id,
            itemSubtotal: pricing.itemSubtotal,
            expectedDiscount: pricing.voucherDiscount,
            memberId: input.memberId,
            email,
            targetKey: voucherTargetKey,
            autoConfirm: true,
          });
        }

        await creditOrderCashbackInTx(tx, order.id);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat pesanan gratis.";
      console.error("[create-order] free order failed", orderCode, error);
      return { ok: false, error: message };
    }

    const createdOrder = await prisma.order.findUnique({
      where: { orderCode },
      select: { id: true },
    });
    if (createdOrder) {
      await finalizePaidOrder(createdOrder.id, orderCode);
    }

    return { ok: true, orderCode };
  }

  // —— Full wallet (saldo and/or poin covers price) ——
  if (settleWithWallet) {
    if (!input.memberId) {
      return { ok: false, error: "Bayar saldo/poin hanya untuk member." };
    }

    const amountPaidBySaldo = wallet.payWithSaldo ? wallet.remainingAfterPoin : 0;
    const orderAmount = amountPaidBySaldo;

    try {
      await prisma.$transaction(async (tx) => {
        await reserveFlashSaleInTx(tx, { ...pricing, isMember });
        const order = await tx.order.create({
          data: {
            orderCode,
            ...identity,
            flashSaleItemId: pricing.flashSaleItemId,
            providerRefId: orderCode,
            memberId: input.memberId!,
            productId: product.id,
            productSkuId: sku.id,
            productNameSnapshot: product.name,
            skuNameSnapshot: sku.name,
            ...orderPricing,
            feeSnapshot: 0,
            amount: orderAmount,
            playerLabel,
            playerNickname: nickname,
            playerFields,
            email,
            whatsapp: whatsapp || null,
            paymentStatus: OrderPaymentStatus.PAID,
            fulfillmentStatus: OrderFulfillmentStatus.QUEUED,
            providerSlug: sku.provider.slug,
            providerSkuSnapshot: sku.providerSku,
            wallet: {
              create: {
                poinUsed: wallet.poinUsed,
                saldoUsed: wallet.payWithSaldo ? wallet.saldoUsed : 0,
                cashbackPoinSnapshot,
              },
            },
          },
        });

        if (voucherCode) {
          await reserveVoucherRedemptionInTx(tx, {
            voucherCode,
            orderId: order.id,
            itemSubtotal: pricing.itemSubtotal,
            expectedDiscount: pricing.voucherDiscount,
            memberId: input.memberId,
            email,
            targetKey: voucherTargetKey,
            autoConfirm: true,
          });
        }

        await debitOrderWalletInTx(tx, order.id);
        await creditOrderCashbackInTx(tx, order.id);
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "INSUFFICIENT_POIN") {
        return { ok: false, error: "Poin tidak cukup. Muat ulang halaman lalu coba lagi." };
      }
      if (code === "INSUFFICIENT_SALDO") {
        return { ok: false, error: "Saldo tidak cukup. Muat ulang halaman lalu coba lagi." };
      }
      console.error("[create-order] wallet settle failed", orderCode, error);
      return {
        ok: false,
        error: code || "Gagal menyelesaikan pembayaran saldo/poin.",
      };
    }

    const createdOrder = await prisma.order.findUnique({
      where: { orderCode },
      select: { id: true },
    });
    if (createdOrder) {
      await finalizePaidOrder(createdOrder.id, orderCode);
    }

    return { ok: true, orderCode };
  }

  const channel = input.paymentChannel.trim().toUpperCase();
  if (!channel || channel === "SALDO") {
    return { ok: false, error: "Pilih metode pembayaran." };
  }

  const gatewayAmount = wallet.gatewayAmount;
  if (gatewayAmount < 1) {
    return { ok: false, error: "Total pembayaran tidak valid." };
  }

  const listed = await listConfiguredDokuChannels();
  if (!listed.ok) return listed;
  if (!listed.channels.some((item) => item.code.toUpperCase() === channel)) {
    return { ok: false, error: "Metode pembayaran tidak tersedia." };
  }

  const gateway = await getPaymentGatewayConfig("doku");
  if (!gateway?.isConfigured) {
    return { ok: false, error: "Payment gateway belum aktif." };
  }

  const appUrl = await getAppUrl();

  let orderId: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      await reserveFlashSaleInTx(tx, { ...pricing, isMember });
      const order = await tx.order.create({
        data: {
          orderCode,
          ...identity,
          flashSaleItemId: pricing.flashSaleItemId,
          providerRefId: orderCode,
          memberId: input.memberId ?? null,
          productId: product.id,
          productSkuId: sku.id,
          productNameSnapshot: product.name,
          skuNameSnapshot: sku.name,
          ...orderPricing,
          feeSnapshot: 0,
          amount: gatewayAmount,
          playerLabel,
          playerNickname: nickname,
          playerFields,
          email,
          whatsapp: whatsapp || null,
          paymentStatus: OrderPaymentStatus.UNPAID,
          fulfillmentStatus: OrderFulfillmentStatus.NONE,
          providerSlug: sku.provider.slug,
          providerSkuSnapshot: sku.providerSku,
          wallet: {
            create: {
              poinUsed: wallet.poinUsed,
              saldoUsed: 0,
              cashbackPoinSnapshot,
            },
          },
        },
      });

      if (voucherCode) {
        await reserveVoucherRedemptionInTx(tx, {
          voucherCode,
          orderId: order.id,
          itemSubtotal: pricing.itemSubtotal,
          expectedDiscount: pricing.voucherDiscount,
          memberId: input.memberId,
          email,
          targetKey: voucherTargetKey,
          autoConfirm: false,
        });
      }

      if (wallet.poinUsed > 0) {
        await debitOrderWalletInTx(tx, order.id);
      }

      return order;
    });
    orderId = created.id;
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "INSUFFICIENT_POIN") {
      return { ok: false, error: "Poin tidak cukup. Muat ulang halaman lalu coba lagi." };
    }
    console.error("[create-order] create+debit failed", orderCode, error);
    return { ok: false, error: code || "Gagal membuat pesanan." };
  }

  const customerName =
    nickname ||
    playerLabel ||
    email?.split("@")[0] ||
    whatsapp ||
    "Customer";

  const doku = await createDokuCheckoutPayment({
    method: channel,
    merchantRef: orderCode,
    amount: gatewayAmount,
    customerName: String(customerName),
    customerEmail: email,
    customerPhone: whatsapp || undefined,
    orderItemName: `${product.name} — ${sku.name}`,
    returnUrl: `${appUrl}/invoice/${orderCode}`,
    expiredMinutes: 1440,
  });

  if (!doku.ok) {
    try {
      await prisma.$transaction(async (tx) => {
        await closeUnpaidOrderInTx(tx, orderId, OrderPaymentStatus.FAILED);
      });
    } catch (error) {
      console.error("[create-order] refund after gateway fail", orderCode, error);
    }
    console.error("[create-order] gateway create failed", orderCode, doku.error);
    return { ok: false, error: doku.error || "Gagal membuat invoice pembayaran." };
  }

  let settled = await persistDokuPayment({
    orderId,
    channel,
    data: doku.data,
    subtotal: gatewayAmount,
  });

  if ("error" in settled) {
    settled = await persistDokuPayment({
      orderId,
      channel,
      data: doku.data,
      subtotal: gatewayAmount,
    });
  }

  if ("error" in settled) {
    console.error("[create-order] persist payment failed", orderCode, settled.error);
    try {
      await prisma.$transaction(async (tx) => {
        await closeUnpaidOrderInTx(tx, orderId, OrderPaymentStatus.FAILED);
      });
    } catch (error) {
      console.error("[create-order] close after persist fail", orderCode, error);
    }
    return { ok: false, error: "Gagal menyimpan invoice pembayaran. Coba lagi." };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      feeSnapshot: settled.feeSnapshot,
      amount: settled.paidAmount,
      expiresAt: settled.expiredAt,
    },
  });

  void notifyOrderCreated(orderId).catch((err) =>
    console.error("[mail] order created notify failed", orderCode, err),
  );

  return { ok: true, orderCode };
}
