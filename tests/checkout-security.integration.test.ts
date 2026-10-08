import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { PrismaClient } from "@/app/generated/prisma/client";

let db: PrismaClient;
let productId: string;
let skuId: string;
let memberId: string;
const code = () => `R9${randomUUID().replaceAll("-", "").slice(0, 20)}`;

before(async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || new URL(url).pathname !== "/r9host_checkout_audit") {
    throw new Error("Use a dedicated TEST_DATABASE_URL ending in /r9host_checkout_audit and apply migrations first.");
  }
  process.env.DATABASE_URL = url;
  db = (await import("@/lib/prisma")).prisma;
  const category = await db.category.create({ data: { slug: code(), name: "Audit" } });
  const provider = await db.fulfillmentProvider.upsert({ where: { slug: "manual" }, create: { slug: "manual", name: "Manual" }, update: {} });
  const product = await db.product.create({ data: { categoryId: category.id, slug: code(), name: "Audit", thumbnailUrl: "" } });
  productId = product.id;
  const sku = await db.productSku.create({ data: { productId, providerId: provider.id, providerSku: code(), name: "Audit SKU", costPrice: 50, priceGuest: 100, priceMember: 100 } });
  skuId = sku.id;
  const member = await db.member.create({ data: { memberCode: `CUS${Date.now().toString().slice(-8)}`, name: "Audit", email: `${code()}@example.com`, balance: { create: { saldo: 100, poin: 100 } } } });
  memberId = member.id;
});

after(async () => {
  if (!db) return;
  // Drain fire-and-forget notifications; mail is disabled in this empty test DB.
  await new Promise((resolve) => setTimeout(resolve, 300));
  const { getFulfillmentQueue } = await import("@/lib/queue/fulfillment-queue");
  await getFulfillmentQueue().close();
  await (await import("@/lib/queue/connection")).getRedisConnection().quit();
  await (await import("@/lib/queue/connection")).getRateLimitRedisConnection().quit();
  await db.$disconnect();
});

async function order(extra: Record<string, unknown> = {}) {
  return db.order.create({ data: {
    orderCode: code(), productId, productSkuId: skuId, memberId,
    productNameSnapshot: "Audit", skuNameSnapshot: "Audit", priceSnapshot: 100, amount: 100,
    email: "buyer@example.com", providerSlug: "manual", providerSkuSnapshot: "audit",
    ...extra,
  } });
}

test("parallel wallet orders cannot spend the same saldo or poin; per-order debit remains idempotent", async () => {
  const { debitOrderWalletInTx } = await import("@/lib/member/order-wallet");
  for (const field of ["saldoUsed", "poinUsed"] as const) {
    await db.memberBalance.update({ where: { memberId }, data: { saldo: 100, poin: 100 } });
    const orders = await Promise.all([order({ wallet: { create: { [field]: 80 } } }), order({ wallet: { create: { [field]: 80 } } })]);
    const results = await Promise.allSettled(orders.map((o) => db.$transaction((tx) => debitOrderWalletInTx(tx, o.id))));
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(results.filter((r) => r.status === "rejected").length, 1);
    const balance = await db.memberBalance.findUniqueOrThrow({ where: { memberId } });
    assert.equal(field === "saldoUsed" ? balance.saldo : balance.poin, 20);
    const wallets = await db.orderWallet.findMany({ where: { orderId: { in: orders.map((o) => o.id) } } });
    assert.equal(wallets.filter((w) => w.walletDebitedAt).length, 1);
    const winner = wallets.find((w) => w.walletDebitedAt)!;
    assert.deepEqual(await db.$transaction((tx) => debitOrderWalletInTx(tx, winner.orderId)), { debited: false });
  }
});

test("parallel credits and refunds preserve every increment", async () => {
  const { creditOrderCashbackInTx } = await import("@/lib/orders/credit-order-cashback");
  const { refundOrderWalletInTx } = await import("@/lib/member/order-wallet");
  await db.memberBalance.update({ where: { memberId }, data: { poin: 0, saldo: 0 } });
  const orders = await Promise.all(Array.from({ length: 8 }, () => order({ paymentStatus: "PAID", wallet: { create: { cashbackPoinSnapshot: 10 } } })));
  await Promise.all(orders.map((o) => db.$transaction((tx) => creditOrderCashbackInTx(tx, o.id))));
  assert.equal((await db.memberBalance.findUniqueOrThrow({ where: { memberId } })).poin, 80);
  const refunds = await Promise.all(Array.from({ length: 8 }, () => order({ paymentStatus: "FAILED", wallet: { create: { saldoUsed: 10, walletDebitedAt: new Date() } } })));
  await Promise.all(refunds.map((o) => db.$transaction((tx) => refundOrderWalletInTx(tx, o.id))));
  assert.equal((await db.memberBalance.findUniqueOrThrow({ where: { memberId } })).saldo, 80);
});

test("voucher per-user limit and global stock hold under concurrent reservations", async () => {
  const { reserveVoucherRedemptionInTx, releaseVoucherRedemptionInTx } = await import("@/lib/promo/voucher-redemption");
  const voucher = await db.promoVoucher.create({ data: { code: code().toUpperCase(), type: "SPECIAL", discountType: "FIXED", discountValue: 100, stock: 20 } });
  const orders = await Promise.all([order(), order()]);
  const reserve = (orderId: string, email: string) => db.$transaction((tx) => reserveVoucherRedemptionInTx(tx, {
    voucherCode: voucher.code, orderId, itemSubtotal: 100, expectedDiscount: 100, email, targetKey: "same-account",
  }));
  const results = await Promise.allSettled(orders.map((o) => reserve(o.id, "same@example.com")));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await db.promoVoucher.findUniqueOrThrow({ where: { id: voucher.id } })).usedCount, 1);
  const redemption = await db.promoVoucherRedemption.findFirstOrThrow({ where: { voucherId: voucher.id } });
  await Promise.all([0, 1].map(() => db.$transaction((tx) => releaseVoucherRedemptionInTx(tx, redemption.orderId))));
  assert.equal((await db.promoVoucher.findUniqueOrThrow({ where: { id: voucher.id } })).usedCount, 0);
  await db.promoVoucher.update({ where: { id: voucher.id }, data: { stock: 1 } });
  const stockOrders = await Promise.all([order(), order()]);
  const stockResults = await Promise.allSettled(stockOrders.map((o, i) => reserve(o.id, `other${i}@example.com`)));
  assert.equal(stockResults.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await db.promoVoucher.findUniqueOrThrow({ where: { id: voucher.id } })).usedCount, 1);
});

test("flash sale allows one last slot and rolls back/reclaims reservations", async () => {
  const { reserveFlashSaleInTx } = await import("@/lib/orders/flash-sale-reservation");
  const { closeUnpaidOrderInTx } = await import("@/lib/orders/close-unpaid-order");
  const sale = await db.flashSale.create({ data: { name: "Audit", startsAt: new Date(Date.now() - 60_000), endsAt: new Date(Date.now() + 3600_000), items: { create: { productSkuId: skuId, priceGuest: 50, priceMember: 50, quota: 1 } } }, include: { items: true } });
  const item = sale.items[0];
  const orders = await Promise.all([order({ flashSaleItemId: item.id }), order({ flashSaleItemId: item.id })]);
  const claim = (id: string) => db.$transaction(async (tx) => {
    await reserveFlashSaleInTx(tx, { flashSaleItemId: item.id, itemSubtotal: 50, isMember: false });
    await tx.order.update({ where: { id }, data: { itemSubtotalSnapshot: 50 } });
  });
  const result = await Promise.allSettled(orders.map((o) => claim(o.id)));
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await db.flashSaleItem.findUniqueOrThrow({ where: { id: item.id } })).soldCount, 1);
  const winner = orders[result.findIndex((r) => r.status === "fulfilled")];
  await Promise.all([0, 1].map(() => db.$transaction((tx) => closeUnpaidOrderInTx(tx, winner.id, "EXPIRED"))));
  assert.equal((await db.flashSaleItem.findUniqueOrThrow({ where: { id: item.id } })).soldCount, 0);
  await assert.rejects(db.$transaction(async (tx) => { await reserveFlashSaleInTx(tx, { flashSaleItemId: item.id, itemSubtotal: 50, isMember: false }); throw new Error("rollback"); }));
  assert.equal((await db.flashSaleItem.findUniqueOrThrow({ where: { id: item.id } })).soldCount, 0);
  const { persistFlashSale } = await import("@/lib/promo/flash-sale-mutations");
  await db.flashSaleItem.update({ where: { id: item.id }, data: { soldCount: 1 } });
  const edit = { name: sale.name, headline: "", headlineAccent: "", tagline: "", startsAt: sale.startsAt, endsAt: sale.endsAt, isEnabled: true, sortOrder: 0, items: [{ productSkuId: skuId, priceGuest: 50, priceMember: 50, quota: 1, soldCount: 0, sortOrder: 0 }] };
  assert.equal(await persistFlashSale(edit, sale.id), null);
  assert.equal((await db.flashSaleItem.findUniqueOrThrow({ where: { id: item.id } })).soldCount, 1);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: winner.id } })).flashSaleItemId, item.id);
  await db.flashSaleItem.update({ where: { id: item.id }, data: { soldCount: 2, quota: 2 } });
  assert.ok((await persistFlashSale(edit, sale.id))?.error);
  assert.equal((await db.flashSaleItem.findUniqueOrThrow({ where: { id: item.id } })).soldCount, 2);
  await db.flashSale.update({ where: { id: sale.id }, data: { isEnabled: false } });
});

test("parallel checkout with one idempotency key creates one invoice and one debit", async () => {
  const { createOrderWithDoku } = await import("@/lib/orders/create-order");
  await db.memberBalance.update({ where: { memberId }, data: { saldo: 500, poin: 0 } });
  const input = { idempotencyKey: randomUUID(), productId, productSkuId: skuId, paymentChannel: "SALDO", memberId, isMember: true, useSaldo: true, email: "buyer@example.com", accountValues: { userId: "42" } };
  const results = await Promise.all(Array.from({ length: 4 }, () => createOrderWithDoku(input)));
  assert.ok(results.every((r) => r.ok), JSON.stringify(results));
  const codes = results.map((r) => r.ok ? r.orderCode : "");
  assert.equal(new Set(codes).size, 1);
  assert.equal(await db.order.count({ where: { orderCode: codes[0] } }), 1);
  assert.equal((await db.memberBalance.findUniqueOrThrow({ where: { memberId } })).saldo, 400);
  assert.equal((await createOrderWithDoku({ ...input, email: "other@example.com" })).ok, false);
});

test("free-voucher checkout and gateway checkout also deduplicate before side effects", async () => {
  const { createOrderWithDoku } = await import("@/lib/orders/create-order");
  const voucher = await db.promoVoucher.create({ data: { code: code().toUpperCase(), type: "SPECIAL", discountType: "FIXED", discountValue: 100, stock: 2 } });
  const freeInput = { idempotencyKey: randomUUID(), productId, productSkuId: skuId, paymentChannel: "SALDO", email: "free@example.com", accountValues: { userId: "43" }, voucherCode: voucher.code };
  const free = await Promise.all([0, 1].map(() => createOrderWithDoku(freeInput)));
  assert.ok(free.every((r) => r.ok), JSON.stringify(free));
  assert.equal(new Set(free.map((r) => r.ok ? r.orderCode : "")).size, 1);
  assert.equal((await db.promoVoucher.findUniqueOrThrow({ where: { id: voucher.id } })).usedCount, 1);

  await db.paymentGateway.upsert({ where: { slug: "doku" }, create: { slug: "doku", name: "Audit", isActive: true, config: { clientId: "audit-client", secretKey: "audit-secret" } }, update: { isActive: true, config: { clientId: "audit-client", secretKey: "audit-secret" } } });
  await db.memberBalance.update({ where: { memberId }, data: { poin: 50 } });
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls += 1;
    const request = JSON.parse(String(init?.body)) as { order: { invoice_number: string; amount: number } };
    await new Promise((resolve) => setTimeout(resolve, 30));
    return Response.json({ order: request.order, payment: { url: "https://example.com/pay" } });
  };
  try {
    const input = { idempotencyKey: randomUUID(), productId, productSkuId: skuId, paymentChannel: "VIRTUAL_ACCOUNT_BCA", memberId, isMember: true, usePoin: true, email: "gateway@example.com", accountValues: { userId: "44" } };
    const results = await Promise.all([0, 1, 2].map(() => createOrderWithDoku(input)));
    assert.ok(results.every((r) => r.ok), JSON.stringify(results));
    assert.equal(calls, 1);
    const codes = results.map((r) => r.ok ? r.orderCode : "");
    assert.equal(new Set(codes).size, 1);
    assert.equal(await db.payment.count({ where: { reference: codes[0] } }), 1);
    assert.equal((await db.memberBalance.findUniqueOrThrow({ where: { memberId } })).poin, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test("PROCESSING cannot force retry and concurrent FAILED retries call the provider once", async () => {
  const { processOrderFulfillment } = await import("@/lib/orders/process-fulfillment");
  const { manualAdapter } = await import("@/lib/providers/fulfillment/adapters/manual-adapter");
  const original = manualAdapter.createOrder;
  let calls = 0;
  manualAdapter.createOrder = async (input) => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { status: "PENDING", providerRef: input.providerRef ?? input.orderCode, message: "test", raw: {} };
  };
  try {
    const processing = await order({ paymentStatus: "PAID", fulfillmentStatus: "PROCESSING" });
    await processOrderFulfillment(processing.id, { forceRetry: true });
    assert.equal(calls, 0);
    const failed = await order({ paymentStatus: "PAID", fulfillmentStatus: "FAILED" });
    await Promise.all([0, 1].map(() => processOrderFulfillment(failed.id, { forceRetry: true })));
    assert.equal(calls, 1);
  } finally { manualAdapter.createOrder = original; }
});

test("duplicate SUCCESS callback credits once; FAILED after PAID cannot downgrade or refund", async () => {
  const { POST } = await import("@/app/api/doku/notification/route");
  const { buildDokuSignature } = await import("@/lib/payments/doku-signature");
  await db.paymentGateway.upsert({ where: { slug: "doku" }, create: { slug: "doku", name: "Audit", isActive: true, config: { clientId: "audit-client", secretKey: "audit-secret" } }, update: { isActive: true, config: { clientId: "audit-client", secretKey: "audit-secret" } } });
  const paid = await order({ wallet: { create: { saldoUsed: 100, walletDebitedAt: new Date(), cashbackPoinSnapshot: 10 } } });
  const pay = await db.payment.create({ data: { orderId: paid.id, provider: "doku", channel: "DOKU", reference: paid.orderCode, amount: 100 } });
  const send = (status: string) => {
    const body = JSON.stringify({ order: { invoice_number: paid.orderCode, amount: 100 }, transaction: { status } });
    const timestamp = new Date().toISOString();
    const signature = buildDokuSignature({ clientId: "audit-client", requestId: "audit-request", timestamp, requestTarget: "/api/doku/notification", secretKey: "audit-secret", body });
    return POST(new Request("https://example.com/api/doku/notification", { method: "POST", headers: { "Client-Id": "audit-client", "Request-Id": "audit-request", "Request-Timestamp": timestamp, Signature: signature }, body }));
  };
  const balanceBefore = await db.memberBalance.findUniqueOrThrow({ where: { memberId } });
  const success = await Promise.all([send("SUCCESS"), send("SUCCESS")]);
  assert.ok(success.every((r) => r.status === 200));
  assert.equal((await db.memberBalance.findUniqueOrThrow({ where: { memberId } })).poin, balanceBefore.poin + 10);
  const response = await send("FAILED");
  assert.equal(response.status, 200);
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: paid.id } })).paymentStatus, "PAID");
  assert.equal((await db.payment.findUniqueOrThrow({ where: { id: pay.id } })).status, "PAID");
  assert.equal((await db.orderWallet.findUniqueOrThrow({ where: { orderId: paid.id } })).walletRefundedAt, null);
});

test("Redis limit is shared and ignores spoofed forwarding headers by default", async () => {
  const { allowCekTransaksiAttempt, lookupClientIp } = await import("@/lib/orders/lookup-rate-limit");
  process.env.TRUST_PROXY_HEADERS = "false";
  assert.equal(lookupClientIp(new Headers({ "x-forwarded-for": "attacker", "x-real-ip": "1.2.3.4" })), "untrusted-ingress");
  const results = await Promise.all(Array.from({ length: 30 }, () => allowCekTransaksiAttempt(code(), 20)));
  assert.equal(results.filter(Boolean).length, 30);
  const key = code();
  const limited = await Promise.all(Array.from({ length: 30 }, () => allowCekTransaksiAttempt(key, 20)));
  assert.equal(limited.filter(Boolean).length, 20);
});
