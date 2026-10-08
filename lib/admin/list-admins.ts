import { AdminRole, type Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRoleValue, type AdminRoleValue } from "@/lib/admin/admin-labels";

export type AdminListFilters = {
  q?: string;
};

export type AdminListItem = {
  id: string;
  name: string;
  email: string;
  role: AdminRoleValue;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export function buildAdminWhere(filters: AdminListFilters): Prisma.AdminWhereInput {
  const q = filters.q?.trim();
  if (!q) return {};

  return {
    OR: [{ name: { contains: q } }, { email: { contains: q } }],
  };
}

export async function listAdmins(options: {
  filters?: AdminListFilters;
  skip?: number;
  take?: number;
}): Promise<{ admins: AdminListItem[]; total: number }> {
  const filters = options.filters ?? {};
  const where = buildAdminWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.admin.findMany({
      where,
      skip: options.skip ?? 0,
      take: options.take ?? 15,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.admin.count({ where }),
  ]);

  return {
    total,
    admins: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: isAdminRoleValue(row.role) ? row.role : "OPERATOR",
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
    })),
  };
}

export async function getAdminById(id: string): Promise<AdminListItem | null> {
  const row = await prisma.admin.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: isAdminRoleValue(row.role) ? row.role : "OPERATOR",
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
  };
}

export async function countActiveSuperAdmins(excludeId?: string): Promise<number> {
  return prisma.admin.count({
    where: {
      role: AdminRole.SUPER,
      isActive: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
}
