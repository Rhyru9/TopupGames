import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { MemberFilters } from "@/components/console/members/member-filters";
import { MemberTable } from "@/components/console/members/member-table";
import { parsePagination } from "@/lib/console-pagination";
import { listMembers, type MemberListFilters } from "@/lib/member/list-members";
import { isMemberStatusValue } from "@/lib/member/member-status";

type MembersPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }>;
};

function resolveStatus(raw?: string): MemberListFilters["status"] {
  if (raw === "inactive") return "inactive";
  if (raw && isMemberStatusValue(raw)) return raw;
  return "";
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const filters: MemberListFilters = {
    q: params.q?.trim() || undefined,
    status: resolveStatus(params.status),
  };
  const { page, pageSize, skip } = parsePagination(params);
  const hasFilters = Boolean(filters.q || filters.status);

  const { members, total } = await listMembers({
    filters,
    skip,
    take: pageSize,
  });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Member"
        title="Member"
        description="Kelola data member — edit, suspend, ban, atau hapus untuk keamanan."
      />

      <div className="console-panel console-list-panel">
        <MemberFilters
          values={{ q: filters.q, status: filters.status || undefined }}
          pageSize={pageSize}
        />
        <MemberTable members={members} hasFilters={hasFilters} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/members"
          query={{
            q: filters.q,
            status: filters.status || undefined,
            pageSize: params.pageSize,
          }}
        />
      </div>
    </div>
  );
}
