import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";

const MEMBER_CODE_PREFIX = "CUS";
const MEMBER_CODE_DIGITS = 8;

/** Format publik ID member: CUS + 8 digit. */
export function formatMemberCodeCandidate(): string {
  const n = randomInt(0, 10 ** MEMBER_CODE_DIGITS);
  return `${MEMBER_CODE_PREFIX}${String(n).padStart(MEMBER_CODE_DIGITS, "0")}`;
}

export function normalizeMemberCodeQuery(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export async function allocateMemberCode(): Promise<string> {
  for (let i = 0; i < 24; i += 1) {
    const code = formatMemberCodeCandidate();
    const exists = await prisma.member.findUnique({
      where: { memberCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("Gagal mengalokasikan ID member unik.");
}
