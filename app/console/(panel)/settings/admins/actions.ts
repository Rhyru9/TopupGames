"use server";

import { withToastUrl } from "@/lib/console-toast";
import {
  parseAdminForm,
  persistAdmin,
  toggleAdminActive,
  validateAdminInput,
  type AdminFormState,
} from "@/lib/admin/admin-mutations";
import { adminToasts } from "@/lib/admin/admin-toasts";
import { assertSuperAdminAction } from "@/lib/admin/require-super";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { AdminFormState };

function revalidateAdminPaths(adminId?: string) {
  revalidatePath("/console/settings/admins");
  if (adminId) {
    revalidatePath(`/console/settings/admins/${adminId}/edit`);
  }
}

export async function saveAdmin(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) return { error: gate.error };

  const adminId = String(formData.get("adminId") ?? "").trim() || undefined;
  const input = parseAdminForm(formData);
  const validation = validateAdminInput(input, { requirePassword: !adminId });
  if (validation) return validation;

  const result = await persistAdmin(input, {
    adminId,
  });
  if (result) return result;

  revalidateAdminPaths(adminId);
  redirect(
    withToastUrl(
      "/console/settings/admins",
      adminId ? adminToasts.updated : adminToasts.created,
    ),
  );
}

export async function toggleAdminStatus(formData: FormData) {
  const gate = await assertSuperAdminAction();
  if (!gate.ok) {
    redirect(withToastUrl("/console", gate.error, "error"));
  }

  const adminId = String(formData.get("adminId") ?? "").trim();
  if (!adminId) return;

  const result = await toggleAdminActive(adminId, gate.admin.id);
  if (result.error) {
    redirect(withToastUrl("/console/settings/admins", result.error, "error"));
  }

  revalidateAdminPaths(adminId);
  redirect(
    withToastUrl(
      "/console/settings/admins",
      result.activated ? adminToasts.activated : adminToasts.deactivated,
    ),
  );
}
