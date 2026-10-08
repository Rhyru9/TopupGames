"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerMember, type MemberAuthFormState } from "@/app/member/actions";
import { MemberGoogleButton } from "@/components/member/member-google-button";

const initialState: MemberAuthFormState = {};

type MemberRegisterFormProps = {
  nextPath: string;
  googleEnabled: boolean;
};

export function MemberRegisterForm({ nextPath, googleEnabled }: MemberRegisterFormProps) {
  const [state, formAction, pending] = useActionState(registerMember, initialState);

  return (
    <div>
      {googleEnabled ? (
        <>
          <MemberGoogleButton nextPath={nextPath} intent="register" label="Daftar dengan Google" />
          <div className="member-auth__divider">atau email</div>
        </>
      ) : null}

      <form action={formAction} className="member-auth__form">
        <input type="hidden" name="next" value={nextPath} />

        <div className="member-auth__field">
          <label className="member-auth__label" htmlFor="name">
            Nama
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            className="member-auth__input"
            placeholder="Nama lengkap"
          />
          {state.fieldErrors?.name ? (
            <p className="member-auth__field-error">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div className="member-auth__field">
          <label className="member-auth__label" htmlFor="email">
            Email
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
            <p className="member-auth__field-error">{state.fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="member-auth__field">
          <label className="member-auth__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="member-auth__input"
            placeholder="Minimal 8 karakter"
          />
          {state.fieldErrors?.password ? (
            <p className="member-auth__field-error">{state.fieldErrors.password}</p>
          ) : null}
        </div>

        {state.error ? <p className="member-auth__error">{state.error}</p> : null}

        <button type="submit" className="member-auth__submit" disabled={pending}>
          {pending ? "Mendaftar..." : "Daftar"}
        </button>
      </form>

      <p className="member-auth__footer">
        Sudah punya akun? <Link href={`/masuk?next=${encodeURIComponent(nextPath)}`}>Masuk</Link>
      </p>
    </div>
  );
}
