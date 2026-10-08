import "dotenv/config";
import { syncSkuAvailability } from "../lib/providers/catalog/sync-sku-availability";
import { prisma } from "../lib/prisma";

async function main() {
  const result = await syncSkuAvailability();
  const { items: _items, ...summary } = result;
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
    // Dijalankan cron tiap 30 menit: proses yang tidak keluar akan menumpuk dan menghabiskan RAM.
    process.exit(process.exitCode ?? 0);
  });
