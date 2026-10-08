import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { MemberLedgerAdjustButton } from "@/components/console/members/member-ledger-adjust-button";
import { MemberLedgerTable } from "@/components/console/members/member-ledger-table";
import { formatRupiah } from "@/lib/format-rupiah";
import { parsePagination } from "@/lib/console-pagination";
import { getOrCreateMemberBalance } from "@/lib/member/member-balance";
import { listMemberLedgerEntries } from "@/lib/member/member-ledger";
import { prisma } from "@/lib/prisma";

type MemberBalanceDetailPageProps = {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string; kind?: string }>;
};

export default async function MemberBalanceDetailPage({
  params,
  searchParams,
}: MemberBalanceDetailPageProps) {
  const { memberId } = await params;
  const query = await searchParams;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, name: true, email: true },
  });
  if (!member) notFound();

  const balance = await getOrCreateMemberBalance(member.id);
  const kind =
    query.kind === "SALDO" || query.kind === "POIN" ? query.kind : "";
  const { page, pageSize, skip } = parsePagination(query);
  const { entries, total } = await listMemberLedgerEntries({
    memberId: member.id,
    kind,
    skip,
    take: pageSize,
  });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Saldo & Poin"
        title={member.name}
        description={`${member.email} — mutasi saldo dan poin tercatat di sini.`}
        backLink={{
          href: "/console/members/balances",
          label: "← Kembali ke Saldo & Poin",
        }}
        actionsSlot={
          <MemberLedgerAdjustButton memberId={member.id} memberName={member.name} />
        }
      />

      <div className="console-panel console-panel--padded" style={{ marginBottom: "1rem" }}>
        <div className="console-provider-panel__stats">
          <div className="console-provider-stat">
            <span className="console-provider-stat__label">Saldo</span>
            <strong>{formatRupiah(balance.saldo)}</strong>
          </div>
          <div className="console-provider-stat">
            <span className="console-provider-stat__label">Poin</span>
            <strong>{balance.poin.toLocaleString("id-ID")}</strong>
          </div>
        </div>
      </div>

      <div className="console-panel">
        <div className="console-panel__head console-panel--padded">
          <h2 className="console-panel__title" style={{ fontSize: "1rem" }}>
            Riwayat mutasi
          </h2>
        </div>
        <MemberLedgerTable entries={entries} hasFilters={Boolean(kind)} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath={`/console/members/balances/${member.id}`}
          query={{ kind: kind || undefined, pageSize: query.pageSize }}
        />
      </div>
    </div>
  );
}
