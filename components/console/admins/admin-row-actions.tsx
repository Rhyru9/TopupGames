"use client";

import { useRef } from "react";
import { toggleAdminStatus } from "@/app/console/(panel)/settings/admins/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import {
  ConsoleIconButton,
  ConsoleIconEdit,
} from "@/components/console/console-icon-button";
import type { AdminListItem } from "@/lib/admin/list-admins";

type AdminRowActionsProps = {
  admin: AdminListItem;
};

export function AdminRowActions({ admin }: AdminRowActionsProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <ConsoleIconButton
        href={`/console/settings/admins/${admin.id}/edit`}
        title="Edit admin"
        variant="accent"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>

      <form
        action={toggleAdminStatus}
        className="console-table-action"
        onSubmit={async (event) => {
          if (skipConfirmRef.current) return;
          event.preventDefault();
          const nextLabel = admin.isActive ? "nonaktifkan" : "aktifkan";
          const confirmed = await confirm({
            title: admin.isActive ? "Nonaktifkan admin?" : "Aktifkan admin?",
            description: `Akun "${admin.name}" akan di${nextLabel}. Admin nonaktif tidak bisa login console.`,
            confirmLabel: admin.isActive ? "Nonaktifkan" : "Aktifkan",
            variant: admin.isActive ? "danger" : "default",
          });
          if (!confirmed) return;
          skipConfirmRef.current = true;
          event.currentTarget.requestSubmit();
        }}
      >
        <input type="hidden" name="adminId" value={admin.id} />
        <ConsoleIconButton
          type="submit"
          title={admin.isActive ? "Nonaktifkan admin" : "Aktifkan admin"}
          variant={admin.isActive ? "danger" : "default"}
        >
          {admin.isActive ? (
            <svg viewBox="0 0 24 24" className="console-icon-btn__svg" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12h8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="console-icon-btn__svg" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12h8M12 8v8" strokeLinecap="round" />
            </svg>
          )}
        </ConsoleIconButton>
      </form>
    </div>
  );
}
