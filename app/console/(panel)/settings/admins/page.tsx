import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { AdminFilters } from "@/components/console/admins/admin-filters";
import { AdminTable } from "@/components/console/admins/admin-table";
import { parsePagination } from "@/lib/console-pagination";
import { listAdmins, type AdminListFilters } from "@/lib/admin/list-admins";

type AdminsPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function AdminsPage({ searchParams }: AdminsPageProps) {
  const params = await searchParams;
  const filters: AdminListFilters = {
    q: params.q?.trim() || undefined,
  };
  const { page, pageSize, skip } = parsePagination(params);
  const hasFilters = Boolean(filters.q);

  const { admins, total } = await listAdmins({
    filters,
    skip,
    take: pageSize,
  });

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Pengaturan"
        title="Admin"
        description="Kelola akun console — Super Admin dan Operator."
        actions={[
          {
            href: "/console/settings/admins/new",
            label: "Tambah admin",
            variant: "primary",
          },
        ]}
      />

      <div className="console-panel console-list-panel">
        <AdminFilters values={{ q: filters.q }} pageSize={pageSize} />
        <AdminTable admins={admins} hasFilters={hasFilters} />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/settings/admins"
          query={{
            q: filters.q,
            pageSize: params.pageSize,
          }}
        />
      </div>
    </div>
  );
}
