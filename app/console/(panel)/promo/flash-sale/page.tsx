import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { FlashSaleAddButton } from "@/components/console/promo/flash-sale-add-button";
import { FlashSaleTable } from "@/components/console/promo/flash-sale-table";
import { parsePagination } from "@/lib/console-pagination";
import { getRunningFlashSale, listFlashSales } from "@/lib/promo/flash-sale-data";
import { flashSaleCreateBlockedToast } from "@/lib/promo/flash-sale-toasts";

type FlashSaleListPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function FlashSaleListPage({ searchParams }: FlashSaleListPageProps) {
  const params = await searchParams;
  const { page, pageSize, skip } = parsePagination(params);
  const [{ rows, total }, running] = await Promise.all([
    listFlashSales({ skip, take: pageSize }),
    getRunningFlashSale(),
  ]);
  const blockedMessage = running ? flashSaleCreateBlockedToast(running.name) : null;

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Promo"
        title="Flash Sale"
        description="Atur campaign flash sale berbasis SKU. Harga coret diambil dari harga normal SKU."
        actionsSlot={<FlashSaleAddButton blockedMessage={blockedMessage} />}
      />

      <div className="console-panel">
        <FlashSaleTable rows={rows} blockedMessage={blockedMessage} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/promo/flash-sale"
          query={{ pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
