"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { filterNavForRole } from "@/lib/admin/admin-access";
import { consoleNavGroups } from "./nav-config";
import { ConsoleNavIcon } from "./console-icons";
import { BrandLogo } from "@/components/site/brand-logo";

type ConsoleSidebarProps = {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  adminRole?: string;
};

function navItemMatches(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/console") return false;
  return pathname.startsWith(`${href}/`);
}

/** Prefers the longest matching href so nested routes don't highlight parents too. */
function resolveActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const group of consoleNavGroups) {
    for (const item of group.items) {
      if (item.disabled) continue;
      if (!navItemMatches(pathname, item.href)) continue;
      if (!best || item.href.length > best.length) {
        best = item.href;
      }
    }
  }
  return best;
}

export function ConsoleSidebar({ open, collapsed, onClose, adminRole }: ConsoleSidebarProps) {
  const pathname = usePathname();
  const activeHref = resolveActiveHref(pathname);
  const navGroups = useMemo(
    () =>
      consoleNavGroups
        .map((group) => ({
          ...group,
          items: filterNavForRole(group.items, adminRole),
        }))
        .filter((group) => group.items.length > 0),
    [adminRole],
  );

  return (
    <>
      <div
        className={`console-overlay ${open ? "console-overlay--open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`console-sidebar ${open ? "console-sidebar--open" : ""} ${collapsed ? "console-sidebar--collapsed" : ""}`}
      >
        <div className="console-sidebar__brand">
          <Link href="/console" className="console-sidebar__logo" onClick={onClose} aria-label="R9HOST — Console">
            <BrandLogo className="console-sidebar__logo-full" alt="" priority />
            <BrandLogo variant="mark" className="console-sidebar__logo-mini" alt="" priority />
          </Link>
          <button
            type="button"
            className="console-sidebar__close console-icon-btn"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="console-sidebar__nav">
          {navGroups.map((group) => (
            <div key={group.title} className="console-sidebar__group">
              <p className="console-sidebar__group-title">{group.title}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = !item.disabled && item.href === activeHref;

                  if (item.disabled) {
                    return (
                      <li key={item.href}>
                        <span
                          className="console-nav-item console-nav-item--disabled"
                          title={collapsed ? item.label : undefined}
                        >
                          <ConsoleNavIcon name={item.icon} />
                          <span className="console-nav-item__label">{item.label}</span>
                          <span className="console-nav-item__soon">Segera</span>
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={`console-nav-item ${active ? "console-nav-item--active" : ""}`}
                      >
                        <ConsoleNavIcon name={item.icon} />
                        <span className="console-nav-item__label">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="console-sidebar__footer">
          <p className="console-sidebar__footer-text">R9host Panel v0.1</p>
        </div>
      </aside>
    </>
  );
}
