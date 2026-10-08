"use client";

import { ConsoleIconButton, ConsoleIconEdit } from "@/components/console/console-icon-button";
import { DeleteTickerButton } from "./delete-ticker-button";
import { TickerStatusToggle } from "./ticker-status-toggle";

type TickerRowActionsProps = {
  tickerId: string;
  tickerLabel: string;
  isActive: boolean;
};

export function TickerRowActions({ tickerId, tickerLabel, isActive }: TickerRowActionsProps) {
  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <TickerStatusToggle tickerId={tickerId} isActive={isActive} />
      <ConsoleIconButton
        href={`/console/ticker/${tickerId}/edit`}
        title="Edit item"
        variant="accent"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <DeleteTickerButton tickerId={tickerId} tickerLabel={tickerLabel} />
    </div>
  );
}
