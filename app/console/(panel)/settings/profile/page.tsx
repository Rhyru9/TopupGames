import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { AdminAvatarForm } from "@/components/console/profile/admin-avatar-form";
import { AdminPasswordForm } from "@/components/console/profile/admin-password-form";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/console/login");

  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatar: true },
  });
  if (!admin) redirect("/console/clear-session");

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Akun"
        title="Pengaturan profil"
        description={`Kelola foto dan password untuk ${admin.name} (${admin.email}).`}
      />

      <div className="console-panel console-panel--padded" style={{ marginBottom: "1rem" }}>
        <h2 className="console-panel__title" style={{ marginBottom: "0.75rem" }}>
          Edit foto
        </h2>
        <AdminAvatarForm initialAvatar={admin.avatar} />
      </div>

      <div className="console-panel console-panel--padded">
        <h2 className="console-panel__title" style={{ marginBottom: "0.75rem" }}>
          Ganti password
        </h2>
        <AdminPasswordForm />
      </div>
    </div>
  );
}
