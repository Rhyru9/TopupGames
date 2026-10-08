import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { Pool } from "pg";
import { signInvoiceAccess } from "@/lib/orders/invoice-access-token";

let pool: Pool;
let code: string;
let privateEmail: string;
let url: string;
let cookieName: string;
let secret: string;

before(async () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  const siteUrl = process.env.AUDIT_SITE_URL;
  secret = process.env.AUTH_SECRET ?? "";
  if (!databaseUrl || new URL(databaseUrl).pathname !== "/r9host_checkout_audit" || !siteUrl || !secret) {
    throw new Error("Set dedicated TEST_DATABASE_URL, AUDIT_SITE_URL (test server) and the server's AUTH_SECRET.");
  }
  pool = new Pool({ connectionString: databaseUrl });
  const fixture = await pool.query('SELECT "orderCode" FROM orders ORDER BY "createdAt" DESC LIMIT 1');
  code = fixture.rows[0]?.orderCode;
  assert.ok(code, "Run checkout integration fixtures first");
  privateEmail = `private-${randomUUID()}@example.com`;
  await pool.query('UPDATE orders SET email = $1 WHERE "orderCode" = $2', [privateEmail, code]);
  url = `${siteUrl.replace(/\/$/, "")}/invoice/${code}`;
  cookieName = `invoice-${createHash("sha256").update(code).digest("hex").slice(0, 24)}`;
});

after(async () => { await pool?.end(); });

test("production invoice response hides PII without access, including serialized React props", async () => {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  const body = await response.text();
  assert.ok(body.includes("Buka invoice"));
  assert.ok(!body.includes(privateEmail));
});

test("valid invoice cookie reveals the invoice; wrong invoice or expired cookie does not", async () => {
  const request = (token: string) => fetch(url, { headers: { Cookie: `${cookieName}=${token}` } });
  const valid = await request(signInvoiceAccess(code, Date.now() + 60_000, secret));
  assert.equal(valid.status, 200);
  assert.ok((await valid.text()).includes(privateEmail));
  for (const token of [signInvoiceAccess("other-invoice", Date.now() + 60_000, secret), signInvoiceAccess(code, Date.now() - 1, secret)]) {
    const denied = await request(token);
    const body = await denied.text();
    assert.ok(body.includes("Buka invoice"));
    assert.ok(!body.includes(privateEmail));
  }
});
