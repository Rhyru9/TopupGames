import "dotenv/config";
import { expireUnpaidOrders } from "../lib/orders/expire-unpaid-orders";
import { prisma } from "../lib/prisma";

async function main() {
  const summary = await expireUnpaidOrders();
  console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
  if (summary.errors.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(process.exitCode ?? 0);
  });
