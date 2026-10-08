import { formatRupiah } from "@/lib/format-rupiah";
import type { MemberListItem } from "@/lib/member/list-members";
import {
  MEMBER_STATUS_LABEL,
  memberStatusBadgeClass,
} from "@/lib/member/member-status";
import { MemberRowActions } from "./member-row-actions";

type MemberTableProps = {
  members: MemberListItem[];
  hasFilters?: boolean;
};

function formatDateTime(value: Date | null) {
  if (!value) return "—";
  return value.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loginLabels(member: MemberListItem) {
  const labels: string[] = [];
  if (member.hasGoogle) labels.push("Google");
  if (member.hasPassword) labels.push("Email");
  return labels.length > 0 ? labels.join(" · ") : "—";
}

export function MemberTable({ members, hasFilters = false }: MemberTableProps) {
  if (members.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" strokeLinecap="round" />
          </svg>
        </div>
        <p className="console-empty__title">
          {hasFilters ? "Tidak ada member cocok" : "Belum ada member"}
        </p>
        <p className="console-empty__text">
          {hasFilters
            ? "Coba ubah kata kunci atau filter status."
            : "Member akan muncul di sini setelah mendaftar di storefront."}
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table console-table--members">
        <thead>
          <tr>
            <th>ID Member</th>
            <th>Member</th>
            <th>Kontak</th>
            <th>Login</th>
            <th className="console-table__count-head">Saldo</th>
            <th className="console-table__count-head">Poin</th>
            <th>Status</th>
            <th>Terakhir login</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const initial = (member.name.trim().charAt(0) || "M").toUpperCase();
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
                <td>
                  <span className="console-table__cell-text">
                    {member.whatsapp?.trim() || "—"}
                  </span>
                </td>
                <td>
                  <span className="console-table__cell-text">{loginLabels(member)}</span>
                  {member.emailVerified ? (
                    <p className="console-table__muted">Email terverifikasi</p>
                  ) : member.hasPassword ? (
                    <p className="console-table__muted">Email belum verifikasi</p>
                  ) : null}
                </td>
                <td className="console-table__count-cell">{formatRupiah(member.saldo)}</td>
                <td className="console-table__count-cell">{member.poin.toLocaleString("id-ID")}</td>
                <td>
                  <span className={`console-badge ${memberStatusBadgeClass(member.status)}`}>
                    {MEMBER_STATUS_LABEL[member.status]}
                  </span>
                  {member.statusReason ? (
                    <p className="console-table__muted console-table__muted--clamp">
                      {member.statusReason}
                    </p>
                  ) : null}
                </td>
                <td>
                  <span className="console-table__cell-text">
                    {formatDateTime(member.lastLoginAt)}
                  </span>
                </td>
                <td className="console-table__actions-cell">
                  <MemberRowActions member={member} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
