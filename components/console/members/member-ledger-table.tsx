import { formatRupiah } from "@/lib/format-rupiah";
import type { MemberLedgerListItem } from "@/lib/member/member-ledger";
import {
  MEMBER_LEDGER_DIRECTION_LABEL,
  MEMBER_LEDGER_KIND_LABEL,
} from "@/lib/member/member-ledger-labels";

type MemberLedgerTableProps = {
  entries: MemberLedgerListItem[];
  hasFilters?: boolean;
};

function formatDateTime(value: Date) {
  return value.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBalance(kind: MemberLedgerListItem["kind"], value: number) {
  return kind === "SALDO" ? formatRupiah(value) : value.toLocaleString("id-ID");
}

export function MemberLedgerTable({ entries, hasFilters = false }: MemberLedgerTableProps) {
  if (entries.length === 0) {
    return (
      <div className="console-empty">
        <p className="console-empty__title">
          {hasFilters ? "Tidak ada mutasi cocok" : "Belum ada mutasi"}
        </p>
        <p className="console-empty__text">
          {hasFilters
            ? "Coba ubah filter jenis."
            : "Mutasi muncul setelah topup saldo member atau admin menambah/mengurangi saldo/poin."}
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--ledger">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Jenis</th>
            <th>Arah</th>
            <th className="console-table__count-head">Sebelum</th>
            <th className="console-table__count-head">Jumlah</th>
            <th className="console-table__count-head">Sesudah</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCredit = entry.direction === "CREDIT";
            const amountLabel = formatBalance(entry.kind, entry.amount);

            return (
              <tr key={entry.id}>
                <td>
                  <span className="console-table__cell-text">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </td>
                <td>
                  <span className="console-table__cell-text">
                    {MEMBER_LEDGER_KIND_LABEL[entry.kind]}
                  </span>
                </td>
                <td>
                  <span
                    className={`console-badge ${
                      isCredit ? "console-badge--success" : "console-badge--danger"
                    }`}
                  >
                    {MEMBER_LEDGER_DIRECTION_LABEL[entry.direction]}
                  </span>
                </td>
                <td className="console-table__count-cell">
                  {formatBalance(entry.kind, entry.balanceBefore)}
                </td>
                <td
                  className={`console-table__count-cell ${
                    isCredit
                      ? "console-table__count-cell--credit"
                      : "console-table__count-cell--debit"
                  }`}
                >
                  {isCredit ? "+" : "−"}
                  {amountLabel}
                </td>
                <td className="console-table__count-cell">
                  {formatBalance(entry.kind, entry.balanceAfter)}
                </td>
                <td>
                  <p className="console-table__primary console-table__primary--wrap">
                    {entry.reason}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
