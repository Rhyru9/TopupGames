"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/console/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-[var(--console-text-strong)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="console-input w-full"
          placeholder="nama@perusahaan.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-[var(--console-text-strong)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="console-input w-full"
          placeholder="Masukkan password"
        />
      </div>

      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 border border-red-500/30 bg-red-950/40 px-3.5 py-3 text-sm text-red-200"
        >
          <span className="mt-0.5 shrink-0 text-red-400" aria-hidden>
            !
          </span>
          <span>{state.error}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="console-btn-primary mt-1"
      >
        {pending ? "Memverifikasi..." : "Masuk Dashboard"}
      </button>
    </form>
  );
}
