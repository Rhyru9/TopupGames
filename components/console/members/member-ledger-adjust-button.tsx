"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  adjustMemberBalance,
  type MemberLedgerFormState,
} from "@/app/console/(panel)/members/balances/actions";
import {
  MEMBER_LEDGER_DIRECTION_LABEL,
  MEMBER_LEDGER_KIND_LABEL,
} from "@/lib/member/member-ledger-labels";

type MemberLedgerAdjustButtonProps = {
  memberId: string;
  memberName: string;
};

const initialState: MemberLedgerFormState = {};

export function MemberLedgerAdjustButton({
  memberId,
  memberName,
}: MemberLedgerAdjustButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="console-btn-primary console-page-header__action"
        onClick={() => setOpen(true)}
      >
        Tambah / kurangi
      </button>
      {open ? (
        <MemberLedgerAdjustModal
          memberId={memberId}
          memberName={memberName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function MemberLedgerAdjustModal({
  memberId,
  memberName,
  onClose,
}: {
  memberId: string;
  memberName: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [state, formAction, pending] = useActionState(adjustMemberBalance, initialState);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, pending]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="console-modal-overlay console-modal-overlay--soft"
      role="presentation"
      onClick={() => {
        if (!pending) onClose();
      }}
    >
      <div
        className="console-modal console-modal--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <form action={formAction} className="console-form console-form--modal">
          <input type="hidden" name="memberId" value={memberId} />

          <div className="console-modal__head console-modal__head--split">
            <div>
              <p className="console-modal__eyebrow">Mutasi</p>
              <h2 id={titleId} className="console-modal__title">
                Tambah / kurangi
              </h2>
            </div>
            <button
              type="button"
              className="console-modal__close"
              onClick={onClose}
              disabled={pending}
              aria-label="Tutup"
            >
              ×
            </button>
          </div>

          <div className="console-modal__body">
            <p className="console-modal__text console-modal__intro">
              Member: <strong>{memberName}</strong>
            </p>

            {state.error ? (
              <div className="console-alert console-alert--error" role="alert">
                {state.error}
              </div>
            ) : null}

            <div className="console-form__grid">
              <div className="console-field">
                <label htmlFor="ledger-adjust-kind" className="console-field__label">
                  Jenis *
                </label>
                <select
                  id="ledger-adjust-kind"
                  name="kind"
                  defaultValue="SALDO"
                  className="console-input w-full"
                  required
                >
                  <option value="SALDO">{MEMBER_LEDGER_KIND_LABEL.SALDO}</option>
                  <option value="POIN">{MEMBER_LEDGER_KIND_LABEL.POIN}</option>
                </select>
                {state.fieldErrors?.kind ? (
                  <p className="console-field__error">{state.fieldErrors.kind}</p>
                ) : null}
              </div>

              <div className="console-field">
                <label htmlFor="ledger-adjust-direction" className="console-field__label">
                  Arah *
                </label>
                <select
                  id="ledger-adjust-direction"
                  name="direction"
                  defaultValue="CREDIT"
                  className="console-input w-full"
                  required
                >
                  <option value="CREDIT">{MEMBER_LEDGER_DIRECTION_LABEL.CREDIT}</option>
                  <option value="DEBIT">{MEMBER_LEDGER_DIRECTION_LABEL.DEBIT}</option>
                </select>
                {state.fieldErrors?.direction ? (
                  <p className="console-field__error">{state.fieldErrors.direction}</p>
                ) : null}
              </div>

              <div className="console-field">
                <label htmlFor="ledger-adjust-amount" className="console-field__label">
                  Jumlah *
                </label>
                <input
                  id="ledger-adjust-amount"
                  name="amount"
                  type="number"
                  min={1}
                  step={1}
                  required
                  className="console-input w-full"
                  placeholder="Contoh: 10000"
                />
                {state.fieldErrors?.amount ? (
                  <p className="console-field__error">{state.fieldErrors.amount}</p>
                ) : null}
              </div>

              <div className="console-field console-field--full">
                <label htmlFor="ledger-adjust-reason" className="console-field__label">
                  Keterangan *
                </label>
                <input
                  id="ledger-adjust-reason"
                  name="reason"
                  type="text"
                  required
                  minLength={3}
                  maxLength={500}
                  className="console-input w-full"
                  placeholder="Contoh: kompensasi order gagal / koreksi admin"
                />
                {state.fieldErrors?.reason ? (
                  <p className="console-field__error">{state.fieldErrors.reason}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="console-modal__actions">
            <button
              type="button"
              className="console-btn-secondary"
              onClick={onClose}
              disabled={pending}
            >
              Batal
            </button>
            <button type="submit" className="console-btn-primary" disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan mutasi"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
