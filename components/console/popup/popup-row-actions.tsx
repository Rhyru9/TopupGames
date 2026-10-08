"use client";

import { ConsoleIconButton, ConsoleIconEdit } from "@/components/console/console-icon-button";
import { DeletePopupButton } from "./delete-popup-button";
import { PopupStatusToggle } from "./popup-status-toggle";

type PopupRowActionsProps = {
  popupId: string;
  popupTitle: string;
  isActive: boolean;
};

export function PopupRowActions({ popupId, popupTitle, isActive }: PopupRowActionsProps) {
  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <PopupStatusToggle popupId={popupId} isActive={isActive} />
      <ConsoleIconButton
        href={`/console/popup/${popupId}/edit`}
        title="Edit popup"
        variant="accent"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <DeletePopupButton popupId={popupId} popupTitle={popupTitle} />
    </div>
  );
}
