import { redirect } from "next/navigation";
import { AdminRole } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { withToastUrl } from "@/lib/console-toast";
import type { AdminRoleValue } from "@/lib/admin/admin-labels";
import { adminToasts } from "@/lib/admin/admin-toasts";
import { prisma } from "@/lib/prisma";

export type SuperAdminSession = {
  id: string;
  role: AdminRoleValue;
  email?: string | null;
  name?: string | null;
};

/** Auth + role SUPER (dari DB), atau redirect ke /console dengan toast error. */
export async function requireSuperAdmin(): Promise<SuperAdminSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/console/login");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true, email: true, name: true },
  });

  if (!admin || !admin.isActive) {
    redirect("/console/clear-session");
  }

  if (admin.role !== AdminRole.SUPER) {
    redirect(withToastUrl("/console", adminToasts.forbidden, "error"));
  }

  return {
    id: admin.id,
    role: "SUPER",
    email: admin.email,
    name: admin.name,
  };
}

/** Untuk server actions: return error message atau null jika OK. */
export async function assertSuperAdminAction(): Promise<
  { ok: true; admin: SuperAdminSession } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sesi tidak valid." };
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true, email: true, name: true },
  });

  if (!admin || !admin.isActive) {
    return { ok: false, error: "Sesi tidak valid." };
  }

  if (admin.role !== AdminRole.SUPER) {
    return { ok: false, error: adminToasts.forbidden };
  }

  return {
    ok: true,
    admin: {
      id: admin.id,
      role: "SUPER",
      email: admin.email,
      name: admin.name,
    },
  };
}
