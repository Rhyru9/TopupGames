"use client";

import { useState, useTransition } from "react";
import { prepareMemberGoogleOAuth } from "@/app/member/actions";

type MemberGoogleButtonProps = {
  nextPath: string;
  intent: "login" | "register";
  label?: string;
};

export function MemberGoogleButton({
  nextPath,
  intent,
  label,
}: MemberGoogleButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const text =
    label ?? (intent === "register" ? "Daftar dengan Google" : "Masuk dengan Google");

  function onClick() {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("next", nextPath);
        const { actionUrl, callbackUrl } = await prepareMemberGoogleOAuth(
          intent,
          formData,
        );

        // Auth.js: GET /signin/:provider = UnknownAction. Harus POST + CSRF.
        const csrfUrl = new URL("/api/member-auth/csrf", actionUrl);
        const csrfRes = await fetch(csrfUrl, {
          credentials: "include",
          headers: { "ngrok-skip-browser-warning": "1" },
        });
        if (!csrfRes.ok) throw new Error("csrf_failed");
        const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
        if (!csrfJson.csrfToken) throw new Error("csrf_missing");

        const form = document.createElement("form");
        form.method = "POST";
        form.action = actionUrl;
        form.style.display = "none";

        for (const [name, value] of Object.entries({
          csrfToken: csrfJson.csrfToken,
          callbackUrl,
        })) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
      } catch {
        setError("Gagal memulai login Google. Coba lagi.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        className="member-auth__google"
        onClick={onClick}
        disabled={pending}
      >
        <GoogleMark />
        {pending ? "Mengalihkan..." : text}
      </button>
      {error ? <p className="member-auth__error">{error}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.5 7.1l.1.1 6.2 5.2C39.2 37.2 44 31.5 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
