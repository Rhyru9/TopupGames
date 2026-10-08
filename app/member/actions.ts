"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/app-url";
import { memberSignIn, memberSignOut, getMemberSession, MEMBER_GOOGLE_INTENT_COOKIE, MEMBER_GOOGLE_NEXT_COOKIE } from "@/lib/member-auth";
import { getOrCreateMemberBalance } from "@/lib/member/member-balance";
import { allocateMemberCode } from "@/lib/member/member-code";
import {
  sendMemberVerificationEmailForMember,
  sendPasswordResetEmailForAddress,
} from "@/lib/mail/member-notifications";
import { consumeMemberEmailToken } from "@/lib/mail/member-tokens";
import { MemberEmailTokenType } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export type MemberAuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function safeNextPath(raw: FormDataEntryValue | null | undefined, fallback = "/member") {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export async function loginMember(
  _prev: MemberAuthFormState,
  formData: FormData,
): Promise<MemberAuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  try {
    await memberSignIn("credentials", {
      email,
      password,
      redirectTo: next,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email atau password salah." };
    }
    throw error;
  }

  return {};
}

export async function prepareMemberGoogleOAuth(
  intent: "login" | "register",
  formData: FormData,
): Promise<{ actionUrl: string; callbackUrl: string }> {
  const next = safeNextPath(formData.get("next"));
  const jar = await cookies();
  const cookieBase = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  };
  jar.set(MEMBER_GOOGLE_INTENT_COOKIE, intent, cookieBase);
  jar.set(MEMBER_GOOGLE_NEXT_COOKIE, next, cookieBase);

  // Auth.js OAuth wajib POST + CSRF — jangan GET /signin/google.
  const base = await getAppUrl();
  return {
    actionUrl: `${base}/api/member-auth/signin/google`,
    callbackUrl: next,
  };
}

/** @deprecated gunakan prepareMemberGoogleOAuth + client POST */
export async function loginMemberGoogle(formData: FormData): Promise<void> {
  const { actionUrl, callbackUrl } = await prepareMemberGoogleOAuth("login", formData);
  redirect(`${actionUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

/** @deprecated gunakan prepareMemberGoogleOAuth + client POST */
export async function registerMemberGoogle(formData: FormData): Promise<void> {
  const { actionUrl, callbackUrl } = await prepareMemberGoogleOAuth("register", formData);
  redirect(`${actionUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

export async function registerMember(
  _prev: MemberAuthFormState,
  formData: FormData,
): Promise<MemberAuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Nama minimal 2 karakter.";
  if (!email.includes("@")) fieldErrors.email = "Email tidak valid.";
  if (password.length < 8) fieldErrors.password = "Password minimal 8 karakter.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const existingEmail = await prisma.member.findUnique({ where: { email } });
  if (existingEmail) {
    return { fieldErrors: { email: "Email sudah terdaftar. Silakan masuk." } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const member = await prisma.member.create({
    data: {
      memberCode: await allocateMemberCode(),
      name,
      email,
      passwordHash,
      emailVerified: null,
      lastLoginAt: new Date(),
    },
  });
  await getOrCreateMemberBalance(member.id);

  void sendMemberVerificationEmailForMember(member.id).catch((error) =>
    console.error("[mail] register verify failed", error),
  );

  try {
    await memberSignIn("credentials", {
      email,
      password,
      redirectTo: next,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Akun dibuat, tapi gagal masuk otomatis. Coba login manual." };
    }
    throw error;
  }

  return {};
}

export async function updateMemberWhatsapp(
  _prev: MemberAuthFormState,
  formData: FormData,
): Promise<MemberAuthFormState> {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    return { error: "Sesi tidak valid. Silakan masuk lagi." };
  }

  const raw = String(formData.get("whatsapp") ?? "").trim();
  const whatsapp = raw ? normalizeWhatsapp(raw) : null;
  if (raw && (!whatsapp || whatsapp.length < 10)) {
    return { fieldErrors: { whatsapp: "WhatsApp tidak valid." } };
  }

  if (whatsapp) {
    const taken = await prisma.member.findFirst({
      where: { whatsapp, NOT: { id: session.user.id } },
      select: { id: true },
    });
    if (taken) {
      return { fieldErrors: { whatsapp: "WhatsApp sudah dipakai akun lain." } };
    }
  }

  await prisma.member.update({
    where: { id: session.user.id },
    data: { whatsapp },
  });

  redirect("/member?saved=1");
}

export async function updateMemberProfile(
  _prev: MemberAuthFormState,
  formData: FormData,
): Promise<MemberAuthFormState> {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    return { error: "Sesi tidak valid. Silakan masuk lagi." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const rawWa = String(formData.get("whatsapp") ?? "").trim();
  const imageRaw = String(formData.get("image") ?? "").trim();
  const whatsapp = rawWa ? normalizeWhatsapp(rawWa) : null;

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Nama minimal 2 karakter.";
  if (rawWa && (!whatsapp || whatsapp.length < 10)) {
    fieldErrors.whatsapp = "WhatsApp tidak valid.";
  }
  if (imageRaw && imageRaw.length > 500) {
    fieldErrors.image = "URL foto terlalu panjang.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  if (whatsapp) {
    const taken = await prisma.member.findFirst({
      where: { whatsapp, NOT: { id: session.user.id } },
      select: { id: true },
    });
    if (taken) {
      return { fieldErrors: { whatsapp: "WhatsApp sudah dipakai akun lain." } };
    }
  }

  await prisma.member.update({
    where: { id: session.user.id },
    data: {
      name,
      whatsapp,
      image: imageRaw || null,
    },
  });

  redirect("/member?saved=1");
}

export async function changeMemberPassword(
  _prev: MemberAuthFormState,
  formData: FormData,
): Promise<MemberAuthFormState> {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    return { error: "Sesi tidak valid. Silakan masuk lagi." };
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!member) {
    return { error: "Akun tidak ditemukan." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (password.length < 8) fieldErrors.password = "Password baru minimal 8 karakter.";
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Konfirmasi password tidak cocok.";
  }

  if (member.passwordHash) {
    if (!currentPassword) {
      fieldErrors.currentPassword = "Password lama wajib diisi.";
    } else {
      const ok = await bcrypt.compare(currentPassword, member.passwordHash);
      if (!ok) fieldErrors.currentPassword = "Password lama salah.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.member.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  redirect("/member/pengaturan?password=1");
}

export async function deactivateMemberAccount(
  _prev: MemberAuthFormState,
  formData: FormData,
): Promise<MemberAuthFormState> {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    return { error: "Sesi tidak valid. Silakan masuk lagi." };
  }

  const confirm = String(formData.get("confirm") ?? "")
    .trim()
    .toUpperCase();
  if (confirm !== "NONAKTIF") {
    return {
      fieldErrors: {
        confirm: 'Ketik NONAKTIF untuk mengonfirmasi.',
      },
    };
  }

  await prisma.member.update({
    where: { id: session.user.id },
    data: {
      status: "SUSPENDED",
      isActive: false,
      statusReason: "Dinonaktifkan oleh member",
      statusAt: new Date(),
    },
  });

  await memberSignOut({ redirectTo: "/?deactivated=1" });
  return {};
}

export async function logoutMember(): Promise<void> {
  await memberSignOut({ redirectTo: "/" });
}

export async function sendMemberVerificationEmail(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Silakan masuk dulu." };
  }
  return sendMemberVerificationEmailForMember(session.user.id);
}

export async function requestPasswordReset(
  _prev: MemberAuthFormState,
  formData: FormData,
): Promise<MemberAuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) {
    return { fieldErrors: { email: "Email tidak valid." } };
  }

  await sendPasswordResetEmailForAddress(email);
  redirect("/masuk?reset=sent");
}

export async function resetPasswordWithToken(
  _prev: MemberAuthFormState,
  formData: FormData,
): Promise<MemberAuthFormState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (!token) fieldErrors.token = "Token tidak valid.";
  if (password.length < 8) fieldErrors.password = "Password minimal 8 karakter.";
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Konfirmasi password tidak cocok.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const consumed = await consumeMemberEmailToken({
    rawToken: token,
    type: MemberEmailTokenType.RESET_PASSWORD,
  });
  if (!consumed.ok) return { error: consumed.error };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.member.update({
    where: { id: consumed.memberId },
    data: { passwordHash },
  });

  redirect("/masuk?reset=ok");
}

export async function verifyMemberEmailToken(
  rawToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const consumed = await consumeMemberEmailToken({
    rawToken,
    type: MemberEmailTokenType.VERIFY,
  });
  if (!consumed.ok) return consumed;

  await prisma.member.update({
    where: { id: consumed.memberId },
    data: { emailVerified: new Date() },
  });

  return { ok: true };
}
