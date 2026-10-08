"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveMember, type MemberFormState } from "@/app/console/(panel)/members/actions";
import {
  MEMBER_STATUS_LABEL,
  MEMBER_STATUSES,
  type MemberStatusValue,
} from "@/lib/member/member-status";

export type MemberFormValues = {
  memberCode: string;
  name: string;
  email: string;
  whatsapp: string;
  status: MemberStatusValue;
  statusReason: string;
};

type MemberFormProps = {
  memberId: string;
  initialValues: MemberFormValues;
  modal?: boolean;
  onCancel?: () => void;
  onSaved?: () => void;
};

const initialState: MemberFormState = {};

export function MemberForm({
  memberId,
  initialValues,
  modal = false,
  onCancel,
  onSaved,
}: MemberFormProps) {
  const [state, formAction, pending] = useActionState(saveMember, initialState);
  const handledSuccessRef = useRef<string | null>(null);

  useEffect(() => {
    if (!modal || !state.success) {
      handledSuccessRef.current = null;
      return;
    }
    if (handledSuccessRef.current === state.success) return;
    handledSuccessRef.current = state.success;
    onSaved?.();
  }, [modal, onSaved, state.success]);

  return (
    <form action={formAction} className={modal ? "console-form console-form--modal-inline" : "console-form"}>
      <input type="hidden" name="memberId" value={memberId} />
      {modal ? <input type="hidden" name="stayOnPage" value="1" /> : null}

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-form__grid">
        <div className="console-field">
          <label className="console-field__label">ID Member</label>
          <input
            className="console-input"
            value={initialValues.memberCode}
            readOnly
            disabled
          />
          {!modal ? (
            <p className="console-field__hint">ID publik tetap (CUS + 8 digit). Tidak dapat diubah.</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor={`name-${memberId}`} className="console-field__label">
            Nama *
          </label>
          <input
            id={`name-${memberId}`}
            name="name"
            type="text"
            defaultValue={initialValues.name}
            required
            maxLength={120}
            className="console-input w-full"
          />
          {state.fieldErrors?.name ? (
            <p className="console-field__error">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor={`email-${memberId}`} className="console-field__label">
            Email *
          </label>
          <input
            id={`email-${memberId}`}
            name="email"
            type="email"
            defaultValue={initialValues.email}
            required
            maxLength={190}
            className="console-input w-full"
          />
          {state.fieldErrors?.email ? (
            <p className="console-field__error">{state.fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor={`whatsapp-${memberId}`} className="console-field__label">
            WhatsApp
          </label>
          <input
            id={`whatsapp-${memberId}`}
            name="whatsapp"
            type="text"
            defaultValue={initialValues.whatsapp}
            maxLength={20}
            className="console-input w-full"
            placeholder="62812…"
          />
          {state.fieldErrors?.whatsapp ? (
            <p className="console-field__error">{state.fieldErrors.whatsapp}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor={`status-${memberId}`} className="console-field__label">
            Status keamanan *
          </label>
          <select
            id={`status-${memberId}`}
            name="status"
            defaultValue={initialValues.status}
            className="console-input w-full"
          >
            {MEMBER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {MEMBER_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          {!modal ? (
            <p className="console-field__hint">
              Suspend / Banned memblokir login member. Aktif mengembalikan akses.
            </p>
          ) : null}
        </div>

        <div className="console-field console-field--full">
          <label htmlFor={`statusReason-${memberId}`} className="console-field__label">
            Alasan status
          </label>
          <input
            id={`statusReason-${memberId}`}
            name="statusReason"
            type="text"
            defaultValue={initialValues.statusReason}
            maxLength={500}
            className="console-input w-full"
            placeholder="Contoh: dugaan fraud / permintaan user"
          />
        </div>
      </div>

      <div className={modal ? "console-modal__actions" : "console-form__actions"}>
        {modal && onCancel ? (
          <button type="button" className="console-btn-ghost" onClick={onCancel} disabled={pending}>
            Batal
          </button>
        ) : null}
        <button
          type="submit"
          className={modal ? "console-btn-primary console-btn-primary--inline" : "console-btn-primary"}
          disabled={pending}
        >
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}
