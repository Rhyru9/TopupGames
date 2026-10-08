/** Client-safe member status constants (jangan import Prisma di client components). */

export const MEMBER_STATUSES = ["ACTIVE", "SUSPENDED", "BANNED"] as const;

export type MemberStatusValue = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABEL: Record<MemberStatusValue, string> = {
  ACTIVE: "Aktif",
  SUSPENDED: "Ditangguhkan",
  BANNED: "Banned",
};

export function isMemberStatusActive(status: string): boolean {
  return status === "ACTIVE";
}

export function memberStatusBadgeClass(status: string): string {
  if (status === "ACTIVE") return "console-badge--success";
  if (status === "SUSPENDED") return "console-badge--warning";
  return "console-badge--danger";
}

export function isMemberStatusValue(value: string): value is MemberStatusValue {
  return (MEMBER_STATUSES as readonly string[]).includes(value);
}
