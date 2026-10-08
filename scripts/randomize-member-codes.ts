/**
 * One-shot: reassign all memberCode to random CUS######## (unique).
 * Run: npx tsx scripts/randomize-member-codes.ts
 */
import "dotenv/config";
import { randomInt } from "node:crypto";
import { createPrismaClient } from "../lib/prisma";

function candidate(): string {
  return `CUS${String(randomInt(0, 100_000_000)).padStart(8, "0")}`;
}

async function main() {
  const prisma = createPrismaClient();
  const members = await prisma.member.findMany({
    select: { id: true, memberCode: true },
    orderBy: { createdAt: "asc" },
  });

  const used = new Set<string>();
  let updated = 0;

  for (const member of members) {
    let code = candidate();
    let tries = 0;
    while (used.has(code) || (await prisma.member.findFirst({
      where: { memberCode: code, NOT: { id: member.id } },
      select: { id: true },
    }))) {
      code = candidate();
      tries += 1;
      if (tries > 40) throw new Error(`Gagal allocate unik untuk ${member.id}`);
    }
    used.add(code);
    if (member.memberCode !== code) {
      await prisma.member.update({
        where: { id: member.id },
        data: { memberCode: code },
      });
      updated += 1;
      console.log(`${member.memberCode} → ${code}`);
    }
  }

  console.log(`Done. Updated ${updated}/${members.length} members.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
