import { ConsoleIconButton, ConsoleIconEdit } from "@/components/console/console-icon-button";
import { formatRupiah } from "@/lib/format-rupiah";
import type { MemberBalanceListItem } from "@/lib/member/member-ledger";
import {
  MEMBER_STATUS_LABEL,
  memberStatusBadgeClass,
  type MemberStatusValue,
} from "@/lib/member/member-status";

type MemberBalancesTableProps = {
  members: MemberBalanceListItem[];
  hasFilters?: boolean;
};

export function MemberBalancesTable({ members, hasFilters = false }: MemberBalancesTableProps) {
  if (members.length === 0) {
    return (
      <div className="console-empty">
        <p className="console-empty__title">
          {hasFilters ? "Tidak ada member cocok" : "Belum ada member"}
        </p>
        <p className="console-empty__text">
          {hasFilters
            ? "Coba ubah kata kunci pencarian."
            : "Member akan muncul di sini setelah mendaftar."}
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--balances">
        <thead>
          <tr>
            <th>ID Member</th>
            <th>Member</th>
            <th className="console-table__count-head">Saldo</th>
            <th className="console-table__count-head">Poin</th>
            <th>Status</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const initial = (member.name.trim().charAt(0) || "M").toUpperCase();
            const status = member.status as MemberStatusValue;
            return (
              <tr key={member.id}>
                <td>
                  <span className="console-table__cell-text" style={{ fontFamily: "ui-monospace, monospace" }}>
                    {member.memberCode}
                  </span>
                </td>
                <td>
                  <div className="console-table__game">
                    <div className="console-table__thumb console-table__thumb--round">
                      {member.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.image}
                          alt=""
                          className="console-table__thumb-img"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="console-table__thumb-fallback" aria-hidden>
                          {initial}
                        </span>
                      )}
                    </div>
                    <div className="console-table__game-meta">
                      <p className="console-table__primary">{member.name}</p>
                      <p className="console-table__muted">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="console-table__count-cell">{formatRupiah(member.saldo)}</td>
                <td className="console-table__count-cell">
                  {member.poin.toLocaleString("id-ID")}
                </td>
                <td>
                  <span className={`console-badge ${memberStatusBadgeClass(status)}`}>
                    {MEMBER_STATUS_LABEL[status] ?? member.status}
                  </span>
                </td>
                <td className="console-table__actions-cell">
                  <div className="console-table__actions console-table__actions--toolbar">
                    <ConsoleIconButton
                      href={`/console/members/balances/${member.id}`}
                      title="Kelola saldo & poin"
                      variant="accent"
                    >
                      <ConsoleIconEdit />
                    </ConsoleIconButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
