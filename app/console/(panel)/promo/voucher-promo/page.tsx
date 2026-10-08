import Link from "next/link";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { VoucherPromoFilters } from "@/components/console/promo/voucher-promo-filters";
import { VoucherPromoTable } from "@/components/console/promo/voucher-promo-table";
import { parsePagination } from "@/lib/console-pagination";
import { listPromoVouchers } from "@/lib/promo/voucher-data";

type VoucherPromoListPageProps = {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
};

export default async function VoucherPromoListPage({ searchParams }: VoucherPromoListPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const { page, pageSize, skip } = parsePagination(params);
  const { rows, total } = await listPromoVouchers({ q, skip, take: pageSize });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Promo"
        title="Voucher Promo"
        description="Kode diskon untuk checkout — umum (minimal transaksi) atau khusus (sekali pakai, boleh gratis)."
        actionsSlot={
          <Link href="/console/promo/voucher-promo/new" className="console-btn-primary">
            + Buat voucher
          </Link>
        }
      />

      <div className="console-panel console-list-panel">
        <VoucherPromoFilters values={{ q }} pageSize={pageSize} />
        <VoucherPromoTable rows={rows} hasFilters={Boolean(q)} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/promo/voucher-promo"
          query={{ q, pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
