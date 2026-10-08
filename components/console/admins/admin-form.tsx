"use client";

import { useActionState } from "react";
import { saveAdmin, type AdminFormState } from "@/app/console/(panel)/settings/admins/actions";
import {
  ADMIN_ROLE_LABEL,
  ADMIN_ROLES,
  type AdminRoleValue,
} from "@/lib/admin/admin-labels";

export type AdminFormValues = {
  name: string;
  email: string;
  role: AdminRoleValue;
  isActive: boolean;
};

type AdminFormProps = {
  mode: "create" | "edit";
  adminId?: string;
  initialValues?: Partial<AdminFormValues>;
};

const initialState: AdminFormState = {};

export function AdminForm({ mode, adminId, initialValues }: AdminFormProps) {
  const [state, formAction, pending] = useActionState(saveAdmin, initialState);
  const values: AdminFormValues = {
    name: initialValues?.name ?? "",
    email: initialValues?.email ?? "",
    role: initialValues?.role ?? "OPERATOR",
    isActive: initialValues?.isActive ?? true,
  };

  return (
    <form action={formAction} className="console-form">
      {adminId ? <input type="hidden" name="adminId" value={adminId} /> : null}

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-form__grid">
        <div className="console-field">
          <label htmlFor="admin-name" className="console-field__label">
            Nama *
          </label>
          <input
            id="admin-name"
            name="name"
            type="text"
            defaultValue={values.name}
            required
            maxLength={120}
            className="console-input w-full"
          />
          {state.fieldErrors?.name ? (
            <p className="console-field__error">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="admin-email" className="console-field__label">
            Email *
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            defaultValue={values.email}
            required
            maxLength={190}
            className="console-input w-full"
          />
          {state.fieldErrors?.email ? (
            <p className="console-field__error">{state.fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="admin-role" className="console-field__label">
            Role *
          </label>
          <select
            id="admin-role"
            name="role"
            defaultValue={values.role}
            className="console-input w-full"
          >
            {ADMIN_ROLES.map((role) => (
              <option key={role} value={role}>
                {ADMIN_ROLE_LABEL[role]}
              </option>
            ))}
          </select>
          {state.fieldErrors?.role ? (
            <p className="console-field__error">{state.fieldErrors.role}</p>
          ) : null}
          <p className="console-field__hint">
            Super Admin mengelola admin, payment, dan provider. Operator mengelola operasional harian.
          </p>
        </div>

        <div className="console-field">
          <label htmlFor="admin-password" className="console-field__label">
            {mode === "create" ? "Password *" : "Password baru"}
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required={mode === "create"}
            minLength={mode === "create" ? 8 : undefined}
            className="console-input w-full"
            placeholder={mode === "edit" ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
          />
          {state.fieldErrors?.password ? (
            <p className="console-field__error">{state.fieldErrors.password}</p>
          ) : null}
          {mode === "edit" ? (
            <p className="console-field__hint">Isi hanya jika ingin mereset password.</p>
          ) : null}
        </div>

        <div className="console-field">
          <label className="console-field__label">Status</label>
          <label className="console-field__label console-field__label--inline">
            <input
              type="checkbox"
              name="isActive"
              value="on"
              defaultChecked={values.isActive}
              className="console-checkbox"
            />
            Aktif (boleh login console)
          </label>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" className="console-btn-primary" disabled={pending}>
          {pending ? "Menyimpan…" : mode === "create" ? "Tambah admin" : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}
