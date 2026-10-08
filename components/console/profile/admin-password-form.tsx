"use client";

import { useActionState } from "react";
import {
  changeAdminPassword,
  type AdminPasswordFormState,
} from "@/app/console/(panel)/settings/profile/actions";

const initialState: AdminPasswordFormState = {};

export function AdminPasswordForm() {
  const [state, formAction, pending] = useActionState(changeAdminPassword, initialState);

  return (
    <form action={formAction} className="console-form" id="password">
      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-form__grid">
        <div className="console-field console-field--full">
          <label htmlFor="currentPassword" className="console-field__label">
            Password saat ini *
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className="console-input w-full"
          />
          {state.fieldErrors?.currentPassword ? (
            <p className="console-field__error">{state.fieldErrors.currentPassword}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="newPassword" className="console-field__label">
            Password baru *
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="console-input w-full"
            placeholder="Minimal 8 karakter"
          />
          {state.fieldErrors?.newPassword ? (
            <p className="console-field__error">{state.fieldErrors.newPassword}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="confirmPassword" className="console-field__label">
            Konfirmasi password *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="console-input w-full"
          />
          {state.fieldErrors?.confirmPassword ? (
            <p className="console-field__error">{state.fieldErrors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" className="console-btn-primary" disabled={pending}>
          {pending ? "Menyimpan…" : "Ganti password"}
        </button>
      </div>
    </form>
  );
}
