import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { isDokuTimestampAcceptable } from "@/lib/payments/doku-timestamp";

function sha256DigestBase64(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("base64");
}

export function buildDokuSignature(input: {
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  secretKey: string;
  body?: string;
}): string {
  const lines = [
    `Client-Id:${input.clientId}`,
    `Request-Id:${input.requestId}`,
    `Request-Timestamp:${input.timestamp}`,
    `Request-Target:${input.requestTarget}`,
  ];
  if (input.body) {
    lines.push(`Digest:${sha256DigestBase64(input.body)}`);
  }
  const hmac = createHmac("sha256", input.secretKey).update(lines.join("\n")).digest("base64");
  return `HMACSHA256=${hmac}`;
}

export function verifyDokuNotificationSignature(input: {
  rawBody: string;
  clientId: string | null;
  requestId: string | null;
  timestamp: string | null;
  signature: string | null;
  requestTarget: string;
  secretKey: string;
}): boolean {
  const clientId = input.clientId?.trim() ?? "";
  const requestId = input.requestId?.trim() ?? "";
  const timestamp = input.timestamp?.trim() ?? "";
  const signature = input.signature?.trim() ?? "";
  if (!clientId || !requestId || !timestamp || !signature) return false;
  if (!isDokuTimestampAcceptable(timestamp)) return false;

  const expected = buildDokuSignature({
    clientId,
    requestId,
    timestamp,
    requestTarget: input.requestTarget,
    secretKey: input.secretKey,
    body: input.rawBody,
  });

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
