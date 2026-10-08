import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { withToastUrl } from "@/lib/console-toast";
import type { AdminRoleValue } from "@/lib/admin/admin-labels";
import { prisma } from "@/lib/prisma";

export type ConsoleAdminSession = {
  id: string;
  role: AdminRoleValue;
  email?: string | null;
  name?: string | null;
};

/** Auth + admin aktif (dari DB). Redirect ke login / clear-session jika invalid. */
export async function requireConsoleAdmin(): Promise<ConsoleAdminSession> {
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

  return {
    id: admin.id,
    role: admin.role as AdminRoleValue,
    email: admin.email,
    name: admin.name,
  };
}

/** Untuk server actions: return error atau admin session. */
export async function assertConsoleAdminAction(): Promise<
  { ok: true; admin: ConsoleAdminSession } | { ok: false; error: string }
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

  return {
    ok: true,
    admin: {
      id: admin.id,
      role: admin.role as AdminRoleValue,
      email: admin.email,
      name: admin.name,
    },
  };
}

/** Redirect ke console jika sesi admin tidak valid (untuk server action yang redirect). */
export async function guardConsoleAdminAction(): Promise<ConsoleAdminSession> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) {
    redirect(withToastUrl("/console", gate.error, "error"));
  }
  return gate.admin;
}
