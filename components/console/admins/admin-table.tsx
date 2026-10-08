import {
  ADMIN_ROLE_LABEL,
  adminActiveBadgeClass,
  adminRoleBadgeClass,
} from "@/lib/admin/admin-labels";
import type { AdminListItem } from "@/lib/admin/list-admins";
import { AdminRowActions } from "./admin-row-actions";

type AdminTableProps = {
  admins: AdminListItem[];
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

export function AdminTable({ admins, hasFilters = false }: AdminTableProps) {
  if (admins.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" strokeLinecap="round" />
          </svg>
        </div>
        <p className="console-empty__title">
          {hasFilters ? "Tidak ada admin cocok" : "Belum ada admin"}
        </p>
        <p className="console-empty__text">
          {hasFilters
            ? "Coba ubah kata kunci pencarian."
            : "Tambah Super Admin atau Operator untuk mengelola console."}
        </p>
      </div>
    );
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th>Admin</th>
            <th>Role</th>
            <th>Status</th>
            <th>Terakhir login</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => {
            const initial = (admin.name.trim().charAt(0) || "A").toUpperCase();
            return (
              <tr key={admin.id}>
                <td>
                  <div className="console-table__game">
                    <div className="console-table__thumb console-table__thumb--round">
                      <span className="console-table__thumb-fallback" aria-hidden>
                        {initial}
                      </span>
                    </div>
                    <div className="console-table__game-meta">
                      <p className="console-table__primary">{admin.name}</p>
                      <p className="console-table__muted">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`console-badge ${adminRoleBadgeClass(admin.role)}`}>
                    {ADMIN_ROLE_LABEL[admin.role]}
                  </span>
                </td>
                <td>
                  <span className={`console-badge ${adminActiveBadgeClass(admin.isActive)}`}>
                    {admin.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td>
                  <span className="console-table__cell-text">{formatDateTime(admin.lastLoginAt)}</span>
                </td>
                <td>
                  <AdminRowActions admin={admin} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
