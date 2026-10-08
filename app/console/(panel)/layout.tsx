import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConsoleShell } from "@/components/console/console-shell";
import { getConsoleOrderAlerts } from "@/lib/orders/get-console-order-alerts";

export default async function ConsolePanelLayout({ children }: LayoutProps<"/console">) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/console/login");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatar: true, isActive: true, role: true },
  });

  if (!admin || !admin.isActive) {
    redirect("/console/clear-session");
  }

  const orderAlerts = await getConsoleOrderAlerts();

  return (
    <ConsoleShell
      adminName={admin.name}
      adminEmail={admin.email}
      adminAvatar={admin.avatar}
      adminRole={admin.role}
      orderAlerts={orderAlerts}
    >
      {children}
    </ConsoleShell>
  );
}
