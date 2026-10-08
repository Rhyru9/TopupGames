import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { MemberBalancesFilters } from "@/components/console/members/member-balances-filters";
import { MemberBalancesTable } from "@/components/console/members/member-balances-table";
import { parsePagination } from "@/lib/console-pagination";
import { listMembersWithBalances } from "@/lib/member/member-ledger";

type MemberBalancesPageProps = {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
};

export default async function MemberBalancesPage({ searchParams }: MemberBalancesPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const { page, pageSize, skip } = parsePagination(params);
  const { members, total } = await listMembersWithBalances({
    q,
    skip,
    take: pageSize,
  });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Member"
        title="Saldo & Poin"
        description="Kelola saldo dan poin member. Setiap perubahan tercatat di mutasi dengan keterangan."
      />

      <div className="console-panel console-list-panel">
        <MemberBalancesFilters values={{ q }} pageSize={pageSize} />
        <MemberBalancesTable members={members} hasFilters={Boolean(q)} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/members/balances"
          query={{ q, pageSize: params.pageSize }}
        />
      </div>
    </div>
  );
}
