/** Client-safe admin role labels (jangan import Prisma di client components). */

export const ADMIN_ROLES = ["SUPER", "OPERATOR"] as const;

export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABEL: Record<AdminRoleValue, string> = {
  SUPER: "Super Admin",
  OPERATOR: "Operator",
};

export function isAdminRoleValue(value: string): value is AdminRoleValue {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}

export function adminRoleBadgeClass(role: string): string {
  if (role === "SUPER") return "console-badge--success";
  return "console-badge--muted";
}

export function adminActiveBadgeClass(isActive: boolean): string {
  return isActive ? "console-badge--success" : "console-badge--danger";
}
