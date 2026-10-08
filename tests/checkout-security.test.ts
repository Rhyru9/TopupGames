import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutIdentity } from "@/lib/orders/checkout-idempotency";
import { signInvoiceAccess, verifyInvoiceAccess } from "@/lib/orders/invoice-access-token";
import { matchesCronSecret } from "@/lib/cron/authorize-cron";
import { buildDokuSignature, verifyDokuNotificationSignature } from "@/lib/payments/doku-signature";

test("checkout key requires entropy and binds the member and checkout contents", () => {
  const input = { idempotencyKey: "0123456789abcdef", productId: "p", productSkuId: "s", paymentChannel: "SALDO", email: "a@example.com", accountValues: { userId: "42", zone: "1" } };
  const identity = checkoutIdentity(input);
  assert.deepEqual(identity, checkoutIdentity({ ...input, accountValues: { zone: "1", userId: "42" } }));
  assert.equal(identity.checkoutKey, checkoutIdentity({ ...input, memberId: "another" }).checkoutKey);
  assert.notEqual(identity.checkoutFingerprint, checkoutIdentity({ ...input, memberId: "another" }).checkoutFingerprint);
  assert.notEqual(identity.checkoutFingerprint, checkoutIdentity({ ...input, productSkuId: "other" }).checkoutFingerprint);
  assert.throws(() => checkoutIdentity({ ...input, idempotencyKey: "" }));
});

test("invoice grant cannot be reused for another invoice, modified, or used after expiry", () => {
  const token = signInvoiceAccess("R9-one", 2000, "test-secret");
  assert.equal(verifyInvoiceAccess("R9-one", token, "test-secret", 1000), true);
  assert.equal(verifyInvoiceAccess("R9-two", token, "test-secret", 1000), false);
  assert.equal(verifyInvoiceAccess("R9-one", token, "wrong-secret", 1000), false);
  assert.equal(verifyInvoiceAccess("R9-one", token, "test-secret", 2000), false);
  assert.equal(verifyInvoiceAccess("R9-one", token.replace("2000", "3000"), "test-secret", 1000), false);
});

test("cron accepts Bearer only, never query-string credentials", () => {
  assert.equal(matchesCronSecret(new Request("https://example.com/cron?secret=secret"), "secret"), false);
  assert.equal(matchesCronSecret(new Request("https://example.com/cron", { headers: { authorization: "Bearer secret" } }), "secret"), true);
  assert.equal(matchesCronSecret(new Request("https://example.com/cron", { headers: { authorization: "Bearer other" } }), "secret"), false);
});

test("DOKU validates signed timestamp, body and request target, including retry age", () => {
  const input = { rawBody: '{"order":{"amount":100}}', clientId: "client", requestId: "request", timestamp: new Date().toISOString(), requestTarget: "/api/doku/notification", secretKey: "test-secret" };
  const signed = (timestamp: string) => ({ ...input, timestamp, signature: buildDokuSignature({ ...input, timestamp, body: input.rawBody }) });
  assert.equal(verifyDokuNotificationSignature(signed(input.timestamp)), true);
  assert.equal(verifyDokuNotificationSignature({ ...signed(input.timestamp), rawBody: "{}" }), false);
  assert.equal(verifyDokuNotificationSignature({ ...signed(input.timestamp), requestTarget: "/different" }), false);
  assert.equal(verifyDokuNotificationSignature(signed(new Date(Date.now() - 12 * 3600_000).toISOString())), true);
  assert.equal(verifyDokuNotificationSignature(signed(new Date(Date.now() - 25 * 3600_000).toISOString())), false);
  assert.equal(verifyDokuNotificationSignature(signed(new Date(Date.now() + 10 * 60_000).toISOString())), false);
  assert.equal(verifyDokuNotificationSignature(signed("not-a-date")), false);
});
