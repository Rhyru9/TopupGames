"use client";

import { ConsoleIconButton, ConsoleIconEdit } from "@/components/console/console-icon-button";
import { BannerStatusToggle } from "./banner-status-toggle";
import { DeleteBannerButton } from "./delete-banner-button";

type BannerRowActionsProps = {
  bannerId: string;
  bannerTitle: string;
  isActive: boolean;
};

export function BannerRowActions({ bannerId, bannerTitle, isActive }: BannerRowActionsProps) {
  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <BannerStatusToggle bannerId={bannerId} isActive={isActive} />
      <ConsoleIconButton
        href={`/console/banners/${bannerId}/edit`}
        title="Edit banner"
        variant="accent"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <DeleteBannerButton bannerId={bannerId} bannerTitle={bannerTitle} />
    </div>
  );
}
