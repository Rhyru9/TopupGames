"use server";

import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  deleteMemberById,
  parseMemberAdminForm,
  persistMemberAdmin,
  setMemberSecurityStatus,
  validateMemberAdminInput,
  type MemberFormState,
} from "@/lib/member/member-admin-mutations";
import { memberToasts } from "@/lib/member/member-toasts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { MemberFormState };

function revalidateMemberPaths(memberId?: string) {
  revalidatePath("/console/members");
  if (memberId) {
    revalidatePath(`/console/members/${memberId}`);
    revalidatePath(`/console/members/${memberId}/edit`);
  }
  revalidatePath("/member");
}

export async function saveMember(
  _prevState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!memberId) return { error: "Member tidak ditemukan." };

  const input = parseMemberAdminForm(formData);
  const validation = validateMemberAdminInput(input);
  if (validation) return validation;

  const result = await persistMemberAdmin(memberId, input);
  if (result) return result;

  revalidateMemberPaths(memberId);

  if (formData.get("stayOnPage") === "1") {
    return { success: memberToasts.updated };
  }

  redirect(withToastUrl("/console/members", memberToasts.updated));
}

export async function suspendMember(formData: FormData) {
  await guardConsoleAdminAction();
  const memberId = String(formData.get("memberId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || "Ditangguhkan oleh admin";
  if (!memberId) return;

  await setMemberSecurityStatus(memberId, "SUSPENDED", reason);
  revalidateMemberPaths(memberId);
  redirect(withToastUrl("/console/members", memberToasts.suspended));
}

export async function banMember(formData: FormData) {
  await guardConsoleAdminAction();
  const memberId = String(formData.get("memberId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || "Diban oleh admin";
  if (!memberId) return;

  await setMemberSecurityStatus(memberId, "BANNED", reason);
  revalidateMemberPaths(memberId);
  redirect(withToastUrl("/console/members", memberToasts.banned));
}

export async function activateMember(formData: FormData) {
  await guardConsoleAdminAction();
  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!memberId) return;

  await setMemberSecurityStatus(memberId, "ACTIVE", null);
  revalidateMemberPaths(memberId);
  redirect(withToastUrl("/console/members", memberToasts.activated));
}

export async function deleteMember(formData: FormData) {
  await guardConsoleAdminAction();
  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!memberId) return;

  await deleteMemberById(memberId);
  revalidateMemberPaths();
  redirect(withToastUrl("/console/members", memberToasts.deleted));
}
