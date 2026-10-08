import { MemberEmailTokenType } from "@/app/generated/prisma/client";
import { getAppUrl } from "@/lib/app-url";
import {
  canSendMemberEmailToken,
  issueMemberEmailToken,
} from "@/lib/mail/member-tokens";
import { mailTemplateKeys } from "@/lib/mail/template-keys";
import { sendTemplatedMail } from "@/lib/mail/send-templated-mail";
import { isMailReady } from "@/lib/mail/get-mail-config";
import { prisma } from "@/lib/prisma";

export async function sendMemberVerificationEmailForMember(
  memberId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isMailReady())) {
    return { ok: false, error: "SMTP belum dikonfigurasi." };
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, name: true, email: true, emailVerified: true },
  });
  if (!member) return { ok: false, error: "Akun tidak ditemukan." };
  if (member.emailVerified) return { ok: false, error: "Email sudah terverifikasi." };

  const allowed = await canSendMemberEmailToken(memberId, MemberEmailTokenType.VERIFY);
  if (!allowed) {
    return { ok: false, error: "Tunggu 2 menit sebelum kirim ulang." };
  }

  const { rawToken } = await issueMemberEmailToken({
    memberId: member.id,
    type: MemberEmailTokenType.VERIFY,
  });
  const baseUrl = await getAppUrl();
  const verifyUrl = `${baseUrl}/member/verifikasi-email?token=${encodeURIComponent(rawToken)}`;

  return sendTemplatedMail({
    template: mailTemplateKeys.memberVerify,
    entityType: "member",
    entityId: `${member.id}:verify`,
    to: member.email,
    data: {
      memberName: member.name,
      verifyUrl,
    },
    skipDedup: true,
  });
}

export async function sendPasswordResetEmailForAddress(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: true };

  if (!(await isMailReady())) {
    return { ok: true };
  }

  const member = await prisma.member.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  // Generic success even if not found
  if (!member?.passwordHash) return { ok: true };

  const allowed = await canSendMemberEmailToken(member.id, MemberEmailTokenType.RESET_PASSWORD);
  if (!allowed) return { ok: true };

  const { rawToken } = await issueMemberEmailToken({
    memberId: member.id,
    type: MemberEmailTokenType.RESET_PASSWORD,
  });
  const baseUrl = await getAppUrl();
  const resetUrl = `${baseUrl}/member/reset-password?token=${encodeURIComponent(rawToken)}`;

  void sendTemplatedMail({
    template: mailTemplateKeys.passwordReset,
    entityType: "member",
    entityId: `${member.id}:reset:${Date.now()}`,
    to: member.email,
    data: {
      memberName: member.name,
      resetUrl,
    },
    skipDedup: true,
  }).catch((error) => console.error("[mail] password reset failed", error));

  return { ok: true };
}
