"use server";

import { assertConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  changeOwnPassword,
  parseAvatarForm,
  parsePasswordForm,
  updateOwnAvatar,
  validatePasswordInput,
  type AdminAvatarFormState,
  type AdminPasswordFormState,
} from "@/lib/admin/admin-profile-mutations";
import { adminProfileToasts } from "@/lib/admin/admin-profile-toasts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type { AdminAvatarFormState, AdminPasswordFormState };

function revalidateProfilePaths() {
  revalidatePath("/console/settings/profile");
  revalidatePath("/console");
}

export async function changeAdminPassword(
  _prevState: AdminPasswordFormState,
  formData: FormData,
): Promise<AdminPasswordFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const input = parsePasswordForm(formData);
  const validation = validatePasswordInput(input);
  if (validation) return validation;

  const result = await changeOwnPassword(gate.admin.id, input);
  if (result) return result;

  revalidateProfilePaths();
  redirect(
    withToastUrl("/console/settings/profile#password", adminProfileToasts.passwordChanged),
  );
}

export async function saveAdminAvatar(
  _prevState: AdminAvatarFormState,
  formData: FormData,
): Promise<AdminAvatarFormState> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { error: gate.error };

  const input = parseAvatarForm(formData);
  const result = await updateOwnAvatar(gate.admin.id, input);
  if (result) return result;

  revalidateProfilePaths();
  redirect(
    withToastUrl(
      "/console/settings/profile#foto",
      input.remove ? adminProfileToasts.avatarRemoved : adminProfileToasts.avatarUpdated,
    ),
  );
}
