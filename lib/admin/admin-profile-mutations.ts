import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type AdminPasswordFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<
    Record<"currentPassword" | "newPassword" | "confirmPassword", string>
  >;
};

export type AdminAvatarFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"avatar", string>>;
};

const BCRYPT_COST = 12;
const MIN_PASSWORD = 8;

export function parsePasswordForm(formData: FormData) {
  return {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
}

export function validatePasswordInput(
  input: ReturnType<typeof parsePasswordForm>,
): AdminPasswordFormState | null {
  const fieldErrors: AdminPasswordFormState["fieldErrors"] = {};

  if (!input.currentPassword) {
    fieldErrors.currentPassword = "Password saat ini wajib diisi.";
  }
  if (!input.newPassword || input.newPassword.length < MIN_PASSWORD) {
    fieldErrors.newPassword = `Password baru minimal ${MIN_PASSWORD} karakter.`;
  }
  if (input.newPassword !== input.confirmPassword) {
    fieldErrors.confirmPassword = "Konfirmasi password tidak cocok.";
  }
  if (
    input.currentPassword &&
    input.newPassword &&
    input.currentPassword === input.newPassword
  ) {
    fieldErrors.newPassword = "Password baru harus berbeda dari password lama.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Periksa kembali form password.", fieldErrors };
  }
  return null;
}

export async function changeOwnPassword(
  adminId: string,
  input: ReturnType<typeof parsePasswordForm>,
): Promise<AdminPasswordFormState | null> {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { passwordHash: true },
  });
  if (!admin) return { error: "Akun tidak ditemukan." };

  const valid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
  if (!valid) {
    return {
      error: "Password saat ini salah.",
      fieldErrors: { currentPassword: "Password saat ini salah." },
    };
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST);
  await prisma.admin.update({
    where: { id: adminId },
    data: { passwordHash },
  });

  return null;
}

export function parseAvatarForm(formData: FormData) {
  const avatar = String(formData.get("avatar") ?? "").trim();
  const remove = formData.get("removeAvatar") === "1";
  return { avatar: avatar || null, remove };
}

export async function updateOwnAvatar(
  adminId: string,
  input: ReturnType<typeof parseAvatarForm>,
): Promise<AdminAvatarFormState | null> {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true },
  });
  if (!admin) return { error: "Akun tidak ditemukan." };

  if (input.remove) {
    await prisma.admin.update({
      where: { id: adminId },
      data: { avatar: null },
    });
    return null;
  }

  if (!input.avatar) {
    return {
      error: "Pilih foto profil terlebih dahulu.",
      fieldErrors: { avatar: "Foto wajib dipilih." },
    };
  }

  if (!input.avatar.startsWith("/uploads/")) {
    return {
      error: "Path foto tidak valid.",
      fieldErrors: { avatar: "Path foto tidak valid." },
    };
  }

  await prisma.admin.update({
    where: { id: adminId },
    data: { avatar: input.avatar },
  });

  return null;
}
