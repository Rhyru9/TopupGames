"use client";

import { ConsoleIconButton, ConsoleIconEdit } from "@/components/console/console-icon-button";
import { DeleteContentPageButton } from "./delete-content-page-button";
import { ContentPageFooterToggle } from "./content-page-footer-toggle";
import { ContentPageStatusToggle } from "./content-page-status-toggle";

type ContentPageRowActionsProps = {
  pageId: string;
  pageTitle: string;
  isActive: boolean;
  showInFooter: boolean;
};

export function ContentPageRowActions({
  pageId,
  pageTitle,
  isActive,
  showInFooter,
}: ContentPageRowActionsProps) {
  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <ContentPageStatusToggle pageId={pageId} isActive={isActive} />
      <ContentPageFooterToggle pageId={pageId} showInFooter={showInFooter} />
      <ConsoleIconButton
        href={`/console/halaman/${pageId}/edit`}
        title="Edit halaman"
        variant="accent"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <DeleteContentPageButton pageId={pageId} pageTitle={pageTitle} />
    </div>
  );
}
