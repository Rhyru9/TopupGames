import type { AdminRoleValue } from "@/lib/admin/admin-labels";

/** Path prefix yang hanya boleh diakses Super Admin. */
export const SUPER_ONLY_PATH_PREFIXES = [
  "/console/settings/admins",
  "/console/settings/payment",
  "/console/settings/providers",
  "/console/settings/website",
] as const;

export function isSuperOnlyPath(pathname: string): boolean {
  return SUPER_ONLY_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function canAccessConsolePath(role: string | undefined, pathname: string): boolean {
  if (!isSuperOnlyPath(pathname)) return true;
  return role === "SUPER";
}

export function filterNavForRole<T extends { href: string }>(
  items: T[],
  role: AdminRoleValue | string | undefined,
): T[] {
  if (role === "SUPER") return items;
  return items.filter((item) => !isSuperOnlyPath(item.href));
}
