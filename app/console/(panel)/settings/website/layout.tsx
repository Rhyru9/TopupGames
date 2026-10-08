import { requireSuperAdmin } from "@/lib/admin/require-super";

export default async function WebsiteSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();
  return children;
}
