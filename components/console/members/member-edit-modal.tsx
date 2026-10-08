"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { MemberForm, type MemberFormValues } from "@/components/console/members/member-form";
import { useConsoleActionToast } from "@/components/console/use-console-action-toast";
import { memberToasts } from "@/lib/member/member-toasts";

type MemberEditModalProps = {
  memberId: string;
  memberName: string;
  initialValues: MemberFormValues;
  open: boolean;
  onClose: () => void;
};

export function MemberEditModal({
  memberId,
  memberName,
  initialValues,
  open,
  onClose,
}: MemberEditModalProps) {
  const titleId = useId();
  const router = useRouter();
  const { notifySuccess } = useConsoleActionToast();
  const [mounted, setMounted] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setFormKey((value) => value + 1);
    }
  }, [open, memberId]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="console-modal-overlay console-modal-overlay--soft"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="console-modal console-modal--compact console-modal--scroll"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="console-modal__head console-modal__head--split">
          <div className="console-modal__head-main">
            <p className="console-modal__eyebrow">Edit member</p>
            <h2 id={titleId} className="console-modal__title">
              {memberName}
            </h2>
          </div>
          <button type="button" className="console-modal__close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        <div className="console-modal__body">
          <MemberForm
            key={formKey}
            memberId={memberId}
            initialValues={initialValues}
            modal
            onCancel={onClose}
            onSaved={() => {
              notifySuccess(memberToasts.updated);
              router.refresh();
              onClose();
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
