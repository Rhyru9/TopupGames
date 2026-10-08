"use client";

import { useActionState } from "react";
import {
  changeMemberPassword,
  deactivateMemberAccount,
  type MemberAuthFormState,
} from "@/app/member/actions";

const initialState: MemberAuthFormState = {};

type MemberSettingsFormsProps = {
  hasPassword: boolean;
  passwordSaved?: boolean;
};

export function MemberSettingsForms({
  hasPassword,
  passwordSaved,
}: MemberSettingsFormsProps) {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changeMemberPassword,
    initialState,
  );
  const [deactivateState, deactivateAction, deactivatePending] = useActionState(
    deactivateMemberAccount,
    initialState,
  );

  return (
    <div className="r9host-account-settings">
      <section className="r9host-account-page__card" aria-labelledby="password-heading">
        <h2 id="password-heading" className="r9host-account-page__section-title">
          {hasPassword ? "Ganti password" : "Buat password"}
        </h2>
        <p className="r9host-account-page__section-lead">
          {hasPassword
            ? "Gunakan password kuat minimal 8 karakter."
            : "Akun Google kamu belum punya password. Buat untuk login dengan email."}
        </p>

        {passwordSaved ? (
          <p className="member-auth__success">Password berhasil disimpan.</p>
        ) : null}

        <form action={passwordAction} className="member-auth__form r9host-account-form">
          {hasPassword ? (
            <div className="member-auth__field">
              <label className="member-auth__label" htmlFor="currentPassword">
                Password lama
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className="member-auth__input"
                autoComplete="current-password"
                required
              />
              {passwordState.fieldErrors?.currentPassword ? (
                <p className="member-auth__field-error">
                  {passwordState.fieldErrors.currentPassword}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="member-auth__field">
            <label className="member-auth__label" htmlFor="password">
              Password baru
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="member-auth__input"
              autoComplete="new-password"
              minLength={8}
              required
            />
            {passwordState.fieldErrors?.password ? (
              <p className="member-auth__field-error">{passwordState.fieldErrors.password}</p>
            ) : null}
          </div>

          <div className="member-auth__field">
            <label className="member-auth__label" htmlFor="confirmPassword">
              Konfirmasi password baru
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="member-auth__input"
              autoComplete="new-password"
              minLength={8}
              required
            />
            {passwordState.fieldErrors?.confirmPassword ? (
              <p className="member-auth__field-error">
                {passwordState.fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          {passwordState.error ? (
            <p className="member-auth__error">{passwordState.error}</p>
          ) : null}

          <button type="submit" className="member-auth__submit" disabled={passwordPending}>
            {passwordPending
              ? "Menyimpan…"
              : hasPassword
                ? "Simpan password"
                : "Buat password"}
          </button>
        </form>
      </section>

      <section
        className="r9host-account-page__card r9host-account-page__card--danger"
        aria-labelledby="deactivate-heading"
      >
        <h2 id="deactivate-heading" className="r9host-account-page__section-title">
          Nonaktifkan akun
        </h2>
        <p className="r9host-account-page__section-lead">
          Akun akan ditangguhkan dan kamu otomatis keluar. Hubungi admin untuk mengaktifkan
          kembali.
        </p>

        <form action={deactivateAction} className="member-auth__form r9host-account-form">
          <div className="member-auth__field">
            <label className="member-auth__label" htmlFor="confirm">
              Ketik <strong>NONAKTIF</strong> untuk konfirmasi
            </label>
            <input
              id="confirm"
              name="confirm"
              className="member-auth__input"
              placeholder="NONAKTIF"
              autoComplete="off"
              required
            />
            {deactivateState.fieldErrors?.confirm ? (
              <p className="member-auth__field-error">{deactivateState.fieldErrors.confirm}</p>
            ) : null}
          </div>

          {deactivateState.error ? (
            <p className="member-auth__error">{deactivateState.error}</p>
          ) : null}

          <button
            type="submit"
            className="r9host-account-form__danger-btn"
            disabled={deactivatePending}
          >
            {deactivatePending ? "Memproses…" : "Nonaktifkan akun"}
          </button>
        </form>
      </section>
    </div>
  );
}
