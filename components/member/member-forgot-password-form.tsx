"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type MemberAuthFormState } from "@/app/member/actions";

const initialState: MemberAuthFormState = {};

export function MemberForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={formAction} className="member-auth__form">
      <div className="member-auth__field">
        <label className="member-auth__label" htmlFor="email">
          Email terdaftar
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="member-auth__input"
          placeholder="nama@email.com"
        />
        {state.fieldErrors?.email ? (
          <p className="member-auth__error">{state.fieldErrors.email}</p>
        ) : null}
      </div>

      {state.error ? <p className="member-auth__error">{state.error}</p> : null}

      <button type="submit" className="member-auth__submit" disabled={pending}>
        {pending ? "Mengirim…" : "Kirim link reset"}
      </button>
    </form>
  );
}

export function MemberForgotPasswordFooter() {
  return (
    <p className="member-auth__footer">
      Ingat password? <Link href="/masuk">Kembali masuk</Link>
    </p>
  );
}
