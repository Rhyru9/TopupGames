"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordWithToken, type MemberAuthFormState } from "@/app/member/actions";

const initialState: MemberAuthFormState = {};

type MemberResetPasswordFormProps = {
  token: string;
};

export function MemberResetPasswordForm({ token }: MemberResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(resetPasswordWithToken, initialState);

  return (
    <form action={formAction} className="member-auth__form">
      <input type="hidden" name="token" value={token} />

      <div className="member-auth__field">
        <label className="member-auth__label" htmlFor="password">
          Password baru
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="member-auth__input"
        />
        {state.fieldErrors?.password ? (
          <p className="member-auth__error">{state.fieldErrors.password}</p>
        ) : null}
      </div>

      <div className="member-auth__field">
        <label className="member-auth__label" htmlFor="confirmPassword">
          Konfirmasi password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="member-auth__input"
        />
        {state.fieldErrors?.confirmPassword ? (
          <p className="member-auth__error">{state.fieldErrors.confirmPassword}</p>
        ) : null}
      </div>

      {state.error ? <p className="member-auth__error">{state.error}</p> : null}

      <button type="submit" className="member-auth__submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan password baru"}
      </button>

      <p className="member-auth__footer">
        <Link href="/masuk">Kembali masuk</Link>
      </p>
    </form>
  );
}
