import bcrypt from "bcryptjs";
import { AdminRole } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isAdminRoleValue,
  type AdminRoleValue,
} from "@/lib/admin/admin-labels";
import { adminToasts } from "@/lib/admin/admin-toasts";
import { countActiveSuperAdmins } from "@/lib/admin/list-admins";

export type AdminFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "role" | "password", string>>;
};

export type AdminFormInput = {
  name: string;
  email: string;
  role: AdminRoleValue;
  password: string;
  isActive: boolean;
};

const BCRYPT_COST = 12;
const MIN_PASSWORD = 8;

export function parseAdminForm(formData: FormData): AdminFormInput {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleRaw = String(formData.get("role") ?? "OPERATOR").trim();
  const password = String(formData.get("password") ?? "");
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "1";

  const role: AdminRoleValue = isAdminRoleValue(roleRaw) ? roleRaw : "OPERATOR";

  return { name, email, role, password, isActive };
}

export function validateAdminInput(
  input: AdminFormInput,
  options: { requirePassword: boolean },
): AdminFormState | null {
  const fieldErrors: AdminFormState["fieldErrors"] = {};

  if (!input.name || input.name.length < 2) {
    fieldErrors.name = "Nama minimal 2 karakter.";
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    fieldErrors.email = "Email tidak valid.";
  }
  if (!isAdminRoleValue(input.role)) {
    fieldErrors.role = "Role tidak valid.";
  }

  if (options.requirePassword) {
    if (!input.password || input.password.length < MIN_PASSWORD) {
      fieldErrors.password = `Password minimal ${MIN_PASSWORD} karakter.`;
    }
  } else if (input.password && input.password.length < MIN_PASSWORD) {
    fieldErrors.password = `Password minimal ${MIN_PASSWORD} karakter.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Periksa kembali data admin.", fieldErrors };
  }
  return null;
}

async function wouldLeaveNoActiveSuper(options: {
  targetId: string;
  nextRole: AdminRoleValue;
  nextActive: boolean;
}): Promise<boolean> {
  const target = await prisma.admin.findUnique({
    where: { id: options.targetId },
    select: { role: true, isActive: true },
  });
  if (!target) return false;

  const wasActiveSuper = target.role === AdminRole.SUPER && target.isActive;
  const willBeActiveSuper = options.nextRole === "SUPER" && options.nextActive;

  if (!wasActiveSuper || willBeActiveSuper) return false;

  const others = await countActiveSuperAdmins(options.targetId);
  return others === 0;
}

export async function persistAdmin(
  input: AdminFormInput,
  options: { adminId?: string },
): Promise<AdminFormState | null> {
  const isCreate = !options.adminId;

  if (isCreate) {
    const emailTaken = await prisma.admin.findFirst({
      where: { email: input.email },
      select: { id: true },
    });
    if (emailTaken) {
      return {
        error: "Email sudah dipakai admin lain.",
        fieldErrors: { email: "Email sudah dipakai." },
      };
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    await prisma.admin.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role as AdminRole,
        isActive: input.isActive,
      },
    });
    return null;
  }

  const adminId = options.adminId!;
  const existing = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!existing) return { error: "Admin tidak ditemukan." };

  const emailTaken = await prisma.admin.findFirst({
    where: { email: input.email, NOT: { id: adminId } },
    select: { id: true },
  });
  if (emailTaken) {
    return {
      error: "Email sudah dipakai admin lain.",
      fieldErrors: { email: "Email sudah dipakai." },
    };
  }

  if (
    await wouldLeaveNoActiveSuper({
      targetId: adminId,
      nextRole: input.role,
      nextActive: input.isActive,
    })
  ) {
    return { error: adminToasts.lastSuper };
  }

  const passwordHash = input.password
    ? await bcrypt.hash(input.password, BCRYPT_COST)
    : undefined;

  await prisma.admin.update({
    where: { id: adminId },
    data: {
      name: input.name,
      email: input.email,
      role: input.role as AdminRole,
      isActive: input.isActive,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  return null;
}

export async function toggleAdminActive(
  adminId: string,
  actorId: string,
): Promise<{ error?: string; activated?: boolean }> {
  const existing = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!existing) return { error: "Admin tidak ditemukan." };

  const nextActive = !existing.isActive;

  if (
    await wouldLeaveNoActiveSuper({
      targetId: adminId,
      nextRole: isAdminRoleValue(existing.role) ? existing.role : "OPERATOR",
      nextActive,
    })
  ) {
    if (adminId === actorId) {
      return { error: adminToasts.selfLastSuper };
    }
    return { error: adminToasts.lastSuper };
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: { isActive: nextActive },
  });

  return { activated: nextActive };
}
