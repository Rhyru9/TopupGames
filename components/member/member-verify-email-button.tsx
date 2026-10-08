"use client";

import { useState, useTransition } from "react";
import { sendMemberVerificationEmail } from "@/app/member/actions";

type MemberVerifyEmailButtonProps = {
  mailConfigured: boolean;
};

export function MemberVerifyEmailButton({ mailConfigured }: MemberVerifyEmailButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setMessage(null);
    startTransition(() => {
      void sendMemberVerificationEmail().then((result) => {
        if (result.ok) {
          setMessage("Email verifikasi terkirim. Cek inbox Anda.");
          return;
        }
        setMessage(result.error);
      });
    });
  }

  return (
    <div className="r9host-profile__verify-action">
      <button
        type="button"
        className="r9host-profile__verify-btn"
        disabled={!mailConfigured || pending}
        title={mailConfigured ? undefined : "SMTP belum dikonfigurasi di Console"}
        onClick={send}
      >
        {pending ? "Mengirim…" : "Kirim verifikasi"}
      </button>
      {message ? <p className="r9host-profile__verify-msg">{message}</p> : null}
    </div>
  );
}
