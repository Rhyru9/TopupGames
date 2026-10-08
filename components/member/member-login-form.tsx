"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginMember, type MemberAuthFormState } from "@/app/member/actions";
import { MemberGoogleButton } from "@/components/member/member-google-button";

const initialState: MemberAuthFormState = {};

type MemberLoginFormProps = {
  nextPath: string;
  googleEnabled: boolean;
  googleError?: string | null;
};

export function MemberLoginForm({
  nextPath,
  googleEnabled,
  googleError = null,
}: MemberLoginFormProps) {
  const [state, formAction, pending] = useActionState(loginMember, initialState);

  return (
    <div>
      {googleError ? <p className="member-auth__error">{googleError}</p> : null}

      {googleEnabled ? (
        <>
          <MemberGoogleButton nextPath={nextPath} intent="login" label="Masuk dengan Google" />
          <div className="member-auth__divider">atau email</div>
        </>
      ) : null}

      <form action={formAction} className="member-auth__form">
        <input type="hidden" name="next" value={nextPath} />

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
        </div>

        <div className="member-auth__field">
          <div className="member-auth__label-row">
            <label className="member-auth__label" htmlFor="password">
              Password
            </label>
            <Link href="/member/lupa-password" className="member-auth__inline-link">
              Lupa password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="member-auth__input"
            placeholder="••••••••"
          />
        </div>

        {state.error ? <p className="member-auth__error">{state.error}</p> : null}

        <button type="submit" className="member-auth__submit" disabled={pending}>
          {pending ? "Memverifikasi..." : "Masuk"}
        </button>
      </form>

      <p className="member-auth__footer">
        Belum punya akun?{" "}
        <Link href={`/daftar?next=${encodeURIComponent(nextPath)}`}>Daftar dulu</Link>
      </p>
    </div>
  );
}
