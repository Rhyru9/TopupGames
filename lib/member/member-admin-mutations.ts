import { MemberStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isMemberStatusActive,
  isMemberStatusValue,
  type MemberStatusValue,
} from "@/lib/member/member-status";

export type MemberFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "whatsapp" | "status", string>>;
};

function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function parseMemberAdminForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const whatsappRaw = String(formData.get("whatsapp") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "ACTIVE").trim();
  const statusReason = String(formData.get("statusReason") ?? "").trim();

  const status: MemberStatusValue = isMemberStatusValue(statusRaw) ? statusRaw : "ACTIVE";

  return {
    name,
    email,
    whatsapp: normalizeWhatsapp(whatsappRaw),
    status,
    statusReason: statusReason || null,
  };
}

export function validateMemberAdminInput(
  input: ReturnType<typeof parseMemberAdminForm>,
): MemberFormState | null {
  const fieldErrors: MemberFormState["fieldErrors"] = {};

  if (!input.name || input.name.length < 2) {
    fieldErrors.name = "Nama minimal 2 karakter.";
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    fieldErrors.email = "Email tidak valid.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Periksa kembali data member.", fieldErrors };
  }
  return null;
}

export async function persistMemberAdmin(
  memberId: string,
  input: ReturnType<typeof parseMemberAdminForm>,
): Promise<MemberFormState | null> {
  const existing = await prisma.member.findUnique({ where: { id: memberId } });
  if (!existing) return { error: "Member tidak ditemukan." };

  const emailTaken = await prisma.member.findFirst({
    where: { email: input.email, NOT: { id: memberId } },
    select: { id: true },
  });
  if (emailTaken) {
    return { error: "Email sudah dipakai member lain.", fieldErrors: { email: "Email sudah dipakai." } };
  }

  if (input.whatsapp) {
    const waTaken = await prisma.member.findFirst({
      where: { whatsapp: input.whatsapp, NOT: { id: memberId } },
      select: { id: true },
    });
    if (waTaken) {
      return {
        error: "WhatsApp sudah dipakai member lain.",
        fieldErrors: { whatsapp: "WhatsApp sudah dipakai." },
      };
    }
  }

  const statusChanged = existing.status !== input.status;

  await prisma.member.update({
    where: { id: memberId },
    data: {
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp,
      status: input.status as MemberStatus,
      isActive: isMemberStatusActive(input.status),
      statusReason: input.statusReason,
      ...(statusChanged ? { statusAt: new Date() } : {}),
    },
  });

  return null;
}

export async function setMemberSecurityStatus(
  memberId: string,
  status: MemberStatusValue,
  reason?: string | null,
) {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return false;

  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: status as MemberStatus,
      isActive: isMemberStatusActive(status),
      statusReason: reason?.trim() || null,
      statusAt: new Date(),
    },
  });
  return true;
}

export async function deleteMemberById(memberId: string) {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return false;
  await prisma.member.delete({ where: { id: memberId } });
  return true;
}
