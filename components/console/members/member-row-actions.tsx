"use client";

import { useState } from "react";
import { deleteMember } from "@/app/console/(panel)/members/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import {
  ConsoleIconButton,
  ConsoleIconEdit,
  ConsoleIconTrash,
  ConsoleIconView,
} from "@/components/console/console-icon-button";
import { MemberEditModal } from "@/components/console/members/member-edit-modal";
import type { MemberListItem } from "@/lib/member/list-members";
import type { MemberStatusValue } from "@/lib/member/member-status";
import { useRef } from "react";

type MemberRowActionsProps = {
  member: MemberListItem;
};

export function MemberRowActions({ member }: MemberRowActionsProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="console-table__actions console-table__actions--toolbar">
        <ConsoleIconButton
          href={`/console/members/${member.id}`}
          title="Lihat detail member"
          variant="default"
        >
          <ConsoleIconView />
        </ConsoleIconButton>

        <ConsoleIconButton
          title="Edit member"
          variant="accent"
          onClick={() => setEditOpen(true)}
        >
          <ConsoleIconEdit />
        </ConsoleIconButton>

        <form
          action={deleteMember}
          className="console-table-action"
          onSubmit={async (event) => {
            if (skipConfirmRef.current) return;
            event.preventDefault();
            const confirmed = await confirm({
              title: "Hapus member permanen?",
              description: `Akun "${member.name}" beserta saldo/poin akan dihapus. Tidak bisa dibatalkan.`,
              confirmLabel: "Hapus",
              variant: "danger",
            });
            if (!confirmed) return;
            skipConfirmRef.current = true;
            event.currentTarget.requestSubmit();
          }}
        >
          <input type="hidden" name="memberId" value={member.id} />
          <ConsoleIconButton type="submit" title="Hapus member" variant="danger">
            <ConsoleIconTrash />
          </ConsoleIconButton>
        </form>
      </div>

      <MemberEditModal
        memberId={member.id}
        memberName={member.name}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialValues={{
          memberCode: member.memberCode,
          name: member.name,
          email: member.email,
          whatsapp: member.whatsapp ?? "",
          status: member.status as MemberStatusValue,
          statusReason: member.statusReason ?? "",
        }}
      />
    </>
  );
}
