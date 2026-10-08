"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAdmin } from "@/app/console/actions";
import type { ConsoleOrderAlertSummary } from "@/lib/orders/get-console-order-alerts";
import { ConsoleAvatar } from "./console-icons";
import { ConsoleNotifications } from "./console-notifications";

type ConsoleHeaderProps = {
  adminName: string;
  adminEmail: string;
  adminAvatar?: string | null;
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
  orderAlerts: ConsoleOrderAlertSummary;
};

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" className="console-account-menu__icon" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.84 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" className="console-account-menu__icon" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" strokeLinecap="round" />
      <path d="M14 12h7M18 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ConsoleHeader({
  adminName,
  adminEmail,
  adminAvatar,
  sidebarCollapsed,
  onMenuClick,
  orderAlerts,
}: ConsoleHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="console-header">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="console-menu-toggle console-icon-btn"
          onClick={onMenuClick}
          aria-label={sidebarCollapsed ? "Perluas sidebar" : "Perkecil sidebar"}
          aria-expanded={!sidebarCollapsed}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <div className="min-w-0">
          <p className="console-header__eyebrow">Panel Operasional</p>
          <h1 className="console-header__title">Dashboard</h1>
        </div>
      </div>

      <div className="console-header__actions">
        <ConsoleNotifications initialAlerts={orderAlerts} />

        <div className="console-dropdown" ref={menuRef}>
          <button
            type="button"
            className="console-dropdown-trigger console-dropdown-trigger--avatar"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Menu akun ${adminName}`}
          >
            <ConsoleAvatar name={adminName} src={adminAvatar} size="lg" />
          </button>

          {menuOpen ? (
            <div className="console-account-menu" role="menu">
              <div className="console-account-menu__head">
                <ConsoleAvatar name={adminName} src={adminAvatar} size="lg" />
                <div className="console-account-menu__meta">
                  <p className="console-account-menu__name">{adminName}</p>
                  <p className="console-account-menu__email">{adminEmail}</p>
                </div>
              </div>

              <div className="console-account-menu__section">
                <Link
                  href="/console/settings/profile"
                  className="console-account-menu__item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="console-account-menu__icon-wrap">
                    <IconSettings />
                  </span>
                  <span className="console-account-menu__item-copy">
                    <span className="console-account-menu__item-title">Profil</span>
                    <span className="console-account-menu__item-desc">Foto & password</span>
                  </span>
                </Link>
              </div>

              <div className="console-account-menu__footer">
                <form action={logoutAdmin}>
                  <button
                    type="submit"
                    className="console-account-menu__item console-account-menu__item--danger"
                    role="menuitem"
                  >
                    <span className="console-account-menu__icon-wrap">
                      <IconLogout />
                    </span>
                    <span className="console-account-menu__item-copy">
                      <span className="console-account-menu__item-title">Keluar</span>
                      <span className="console-account-menu__item-desc">Akhiri sesi console</span>
                    </span>
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
