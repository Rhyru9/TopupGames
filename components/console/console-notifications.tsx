"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ConsoleOrderAlertSummary } from "@/lib/orders/get-console-order-alerts";

const POLL_MS = 45_000;

type ConsoleNotificationsProps = {
  initialAlerts: ConsoleOrderAlertSummary;
};

function formatRelativeId(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hr lalu`;
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="console-notif__bell-icon" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.25a1.1 1.1 0 0 0-1.1 1.1v.7A6.75 6.75 0 0 0 5.25 10.7v2.86l-1.72 2.58a1 1 0 0 0 .84 1.56h15.26a1 1 0 0 0 .84-1.56l-1.72-2.58V10.7A6.75 6.75 0 0 0 13.1 4.05v-.7A1.1 1.1 0 0 0 12 2.25Z"
      />
      <path
        fill="currentColor"
        d="M9.55 18.35a2.45 2.45 0 0 0 4.9 0H9.55Z"
        opacity="0.92"
      />
    </svg>
  );
}

export function ConsoleNotifications({ initialAlerts }: ConsoleNotificationsProps) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(initialAlerts);
  const wrapRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/console/order-alerts", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ConsoleOrderAlertSummary;
      setAlerts(data);
    } catch {
      /* ignore transient network errors */
    }
  }, []);

  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;

    void refresh();

    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, refresh]);

  const badge = alerts.total > 99 ? "99+" : alerts.total > 0 ? String(alerts.total) : null;

  return (
    <div className="console-dropdown console-notif" ref={wrapRef}>
      <button
        type="button"
        className={`console-notif__trigger${alerts.total > 0 ? " is-active" : ""}${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          alerts.total > 0
            ? `Notifikasi pesanan, ${alerts.total} perlu perhatian`
            : "Notifikasi pesanan"
        }
      >
        <IconBell />
        {badge ? <span className="console-notif__badge">{badge}</span> : null}
      </button>

      {open ? (
        <div className="console-notif-menu" role="menu">
          <div className="console-notif-menu__head">
            <p className="console-notif-menu__title">Pesanan perlu perhatian</p>
            <p className="console-notif-menu__subtitle">
              Top-up gagal, antrean, dan yang sedang diproses
            </p>
          </div>

          <div className="console-notif-menu__summary">
            <Link
              href="/console/orders?fulfillmentStatus=FAILED"
              className="console-notif-summary__chip console-notif-summary__chip--danger"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="console-notif-summary__count">{alerts.failed}</span>
              <span className="console-notif-summary__label">Gagal</span>
            </Link>
            <Link
              href="/console/orders?fulfillmentStatus=QUEUED"
              className="console-notif-summary__chip console-notif-summary__chip--queued"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="console-notif-summary__count">{alerts.queued}</span>
              <span className="console-notif-summary__label">Antrean</span>
            </Link>
            <Link
              href="/console/orders?fulfillmentStatus=PROCESSING"
              className="console-notif-summary__chip console-notif-summary__chip--processing"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="console-notif-summary__count">{alerts.processing}</span>
              <span className="console-notif-summary__label">Diproses</span>
            </Link>
          </div>

          <div className="console-notif-menu__list">
            {alerts.items.length === 0 ? (
              <p className="console-notif-menu__empty">Tidak ada pesanan yang perlu ditindak.</p>
            ) : (
              alerts.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/console/orders/${item.id}`}
                  className="console-notif-item"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <span className={`console-notif-item__dot console-notif-item__dot--${item.kind}`} />
                  <span className="console-notif-item__body">
                    <span className="console-notif-item__code">{item.orderCode}</span>
                    <span className="console-notif-item__product">{item.productName}</span>
                    <span className="console-notif-item__meta">
                      <span className={`console-badge console-badge--${item.kind === "failed" ? "danger" : item.kind === "queued" ? "warning" : "muted"}`}>
                        {item.label}
                      </span>
                      <span>{formatRelativeId(item.createdAt)}</span>
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>

          <div className="console-notif-menu__footer">
            <Link
              href="/console/orders"
              className="console-notif-menu__all"
              onClick={() => setOpen(false)}
            >
              Lihat semua pesanan
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
