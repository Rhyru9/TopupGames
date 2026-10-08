"use client";

import { useActionState, useRef } from "react";
import {
  saveAdminAvatar,
  type AdminAvatarFormState,
} from "@/app/console/(panel)/settings/profile/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";

type AdminAvatarFormProps = {
  initialAvatar?: string | null;
};

const initialState: AdminAvatarFormState = {};

export function AdminAvatarForm(props: AdminAvatarFormProps) {
  return (
    <ConsoleFormUploadProvider>
      <AdminAvatarFormContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function AdminAvatarFormContent({ initialAvatar }: AdminAvatarFormProps) {
  const [state, formAction, pending] = useActionState(saveAdminAvatar, initialState);
  const { onSubmit, isUploading, uploadError } = useConsoleFormUploadSubmit(formAction);
  const isSaving = pending || isUploading;
  const removeRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      className="console-form"
      id="foto"
    >
      <input ref={removeRef} type="hidden" name="removeAvatar" value="0" />

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}
      {uploadError ? (
        <div className="console-alert console-alert--error" role="alert">
          {uploadError}
        </div>
      ) : null}

      <ConsoleImageUpload
        name="avatar"
        kind="admin-avatar"
        label="Foto profil"
        initialValue={initialAvatar ?? ""}
        error={state.fieldErrors?.avatar}
        hint="Disarankan foto persegi. Akan tampil di header console."
      />

      <div className="console-form__actions">
        <button
          type="submit"
          className="console-btn-primary"
          disabled={isSaving}
          onClick={() => {
            if (removeRef.current) removeRef.current.value = "0";
          }}
        >
          {isSaving ? "Menyimpan…" : "Simpan foto"}
        </button>
        {initialAvatar ? (
          <button
            type="submit"
            className="console-btn-secondary"
            disabled={isSaving}
            onClick={() => {
              if (removeRef.current) removeRef.current.value = "1";
            }}
          >
            Hapus foto
          </button>
        ) : null}
      </div>
    </form>
  );
}
