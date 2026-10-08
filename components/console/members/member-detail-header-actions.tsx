"use client";

import { useState } from "react";
import {
  ConsoleIconButton,
  ConsoleIconEdit,
} from "@/components/console/console-icon-button";
import { MemberEditModal } from "@/components/console/members/member-edit-modal";
import type { MemberAdminDetail } from "@/lib/member/get-member-admin-detail";
import type { MemberStatusValue } from "@/lib/member/member-status";

type MemberDetailHeaderActionsProps = {
  member: MemberAdminDetail;
};

export function MemberDetailHeaderActions({ member }: MemberDetailHeaderActionsProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <ConsoleIconButton title="Edit member" variant="accent" onClick={() => setEditOpen(true)}>
        <ConsoleIconEdit />
      </ConsoleIconButton>

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
