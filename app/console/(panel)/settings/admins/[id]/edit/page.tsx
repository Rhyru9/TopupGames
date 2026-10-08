import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { AdminForm } from "@/components/console/admins/admin-form";
import { getAdminById } from "@/lib/admin/list-admins";

type EditAdminPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAdminPage({ params }: EditAdminPageProps) {
  const { id } = await params;
  const admin = await getAdminById(id);
  if (!admin) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Pengaturan"
        title="Edit admin"
        description={`Perbarui akun ${admin.name}.`}
        backLink={{
          href: "/console/settings/admins",
          label: "← Kembali ke daftar admin",
        }}
      />

      <div className="console-panel console-panel--padded">
        <AdminForm
          mode="edit"
          adminId={admin.id}
          initialValues={{
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
          }}
        />
      </div>
    </div>
  );
}
