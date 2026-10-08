"use client";

import { FlashSaleAddButton } from "./flash-sale-add-button";
import { FlashSaleRowActions } from "./flash-sale-row-actions";
import { FlashSaleStatusToggle } from "./flash-sale-status-toggle";
import {
  flashSaleScheduleLabel,
  type FlashSaleListItem,
} from "@/lib/promo/flash-sale-shared";

type FlashSaleTableProps = {
  rows: FlashSaleListItem[];
  blockedMessage?: string | null;
};

function formatSchedule(date: Date) {
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FlashSaleTable({ rows, blockedMessage = null }: FlashSaleTableProps) {
  if (rows.length === 0) {
    return (
      <div className="console-empty">
        <p className="console-empty__title">Belum ada flash sale</p>
        <p className="console-empty__text">
          Buat campaign flash sale dan pilih SKU yang ikut promo.
        </p>
        <div className="mt-4">
          <FlashSaleAddButton
            blockedMessage={blockedMessage}
            className="console-btn-primary inline-flex"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--flash-sale">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Jadwal</th>
            <th>Status</th>
            <th>SKU</th>
            <th>Aktif</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const schedule = flashSaleScheduleLabel(row.startsAt, row.endsAt);
            return (
              <tr key={row.id}>
                <td>
                  <p className="console-table__primary">{row.name}</p>
                  <p className="console-field__hint">Urutan {row.sortOrder}</p>
                </td>
                <td>
                  <p className="console-table__cell-text">{formatSchedule(row.startsAt)}</p>
                  <p className="console-field__hint">s/d {formatSchedule(row.endsAt)}</p>
                </td>
                <td>
                  <span
                    className={`console-badge ${
                      schedule === "Berjalan"
                        ? "console-badge--success"
                        : schedule === "Terjadwal"
                          ? ""
                          : "console-badge--muted"
                    }`}
                  >
                    {schedule}
                  </span>
                </td>
                <td>
                  <strong>{row.itemCount}</strong>
                </td>
                <td>
                  <FlashSaleStatusToggle flashSaleId={row.id} isEnabled={row.isEnabled} />
                </td>
                <td className="console-table__actions-cell">
                  <FlashSaleRowActions flashSaleId={row.id} name={row.name} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
