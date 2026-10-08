import { createHash, randomBytes } from "node:crypto";
import { MemberEmailTokenType } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function createRawEmailToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function issueMemberEmailToken(input: {
  memberId: string;
  type: MemberEmailTokenType;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = createRawEmailToken();
  const expiresAt = new Date(
    Date.now() + (input.type === MemberEmailTokenType.VERIFY ? VERIFY_TTL_MS : RESET_TTL_MS),
  );

  await prisma.memberEmailToken.deleteMany({
    where: {
      memberId: input.memberId,
      type: input.type,
      usedAt: null,
    },
  });

  await prisma.memberEmailToken.create({
    data: {
      memberId: input.memberId,
      type: input.type,
      tokenHash: hashToken(rawToken),
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export async function canSendMemberEmailToken(
  memberId: string,
  type: MemberEmailTokenType,
): Promise<boolean> {
  const latest = await prisma.memberEmailToken.findFirst({
    where: { memberId, type },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!latest) return true;
  return Date.now() - latest.createdAt.getTime() >= RESEND_COOLDOWN_MS;
}

export async function consumeMemberEmailToken(input: {
  rawToken: string;
  type: MemberEmailTokenType;
}): Promise<{ ok: true; memberId: string } | { ok: false; error: string }> {
  const tokenHash = hashToken(input.rawToken.trim());
  const row = await prisma.memberEmailToken.findUnique({
    where: { tokenHash },
    select: { id: true, memberId: true, type: true, expiresAt: true, usedAt: true },
  });

  if (!row || row.type !== input.type) {
    return { ok: false, error: "Token tidak valid atau sudah dipakai." };
  }
  if (row.usedAt) return { ok: false, error: "Token sudah dipakai." };
  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Token sudah kedaluwarsa." };
  }

  const claimed = await prisma.memberEmailToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) {
    return { ok: false, error: "Token sudah dipakai." };
  }

  return { ok: true, memberId: row.memberId };
}
