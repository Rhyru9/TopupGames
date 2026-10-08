import type { Prisma } from "@/app/generated/prisma/client";

export async function ensureMemberBalanceInTx(tx: Prisma.TransactionClient, memberId: string) {
  // ON CONFLICT avoids aborting a PostgreSQL transaction on concurrent creation.
  await tx.memberBalance.createMany({
    data: [{ memberId, saldo: 0, poin: 0 }],
    skipDuplicates: true,
  });
}
