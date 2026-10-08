import { ConsolePageHeader } from "@/components/console/console-page-header";
import { AdminForm } from "@/components/console/admins/admin-form";

export default function NewAdminPage() {
  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Pengaturan"
        title="Tambah admin"
        description="Buat akun Super Admin atau Operator baru."
        backLink={{
          href: "/console/settings/admins",
          label: "← Kembali ke daftar admin",
        }}
      />

      <div className="console-panel console-panel--padded">
        <AdminForm mode="create" />
      </div>
    </div>
  );
}
