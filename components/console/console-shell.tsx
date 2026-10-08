"use client";

import { Suspense, useEffect, useState } from "react";
import { ConsoleConfirmProvider } from "./console-confirm-provider";
import { ConsoleHeader } from "./console-header";
import { ConsoleSidebar } from "./console-sidebar";
import { ConsoleToastListener } from "./console-toast-listener";
import { ConsoleToastProvider } from "./console-toast-provider";
import { CONSOLE_SIDEBAR_KEY, getStoredSidebarCollapsed } from "@/lib/console-theme";
import type { ConsoleOrderAlertSummary } from "@/lib/orders/get-console-order-alerts";

const DESKTOP_BREAKPOINT = 1024;

type ConsoleShellProps = {
  adminName: string;
  adminEmail: string;
  adminAvatar?: string | null;
  adminRole?: string;
  orderAlerts: ConsoleOrderAlertSummary;
  children: React.ReactNode;
};

export function ConsoleShell({
  adminName,
  adminEmail,
  adminAvatar,
  adminRole,
  orderAlerts,
  children,
}: ConsoleShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(getStoredSidebarCollapsed());
    document.documentElement.dataset.consoleUiReady = "1";
  }, []);

  useEffect(() => {
    function syncSidebar() {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) {
        setSidebarOpen(false);
      }
    }

    syncSidebar();
    window.addEventListener("resize", syncSidebar);
    return () => window.removeEventListener("resize", syncSidebar);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  function handleMenuToggle() {
    if (window.innerWidth >= DESKTOP_BREAKPOINT) {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem(CONSOLE_SIDEBAR_KEY, next ? "1" : "0");
        document.documentElement.dataset.consoleSidebarCollapsed = next ? "1" : "0";
        return next;
      });
      return;
    }
    setSidebarOpen(true);
  }

  return (
    <div
      className={`console-layout ${sidebarCollapsed ? "console-layout--sidebar-collapsed" : ""}`}
    >
      <ConsoleSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        adminRole={adminRole}
      />

      <div className="console-main">
        <ConsoleHeader
          adminName={adminName}
          adminEmail={adminEmail}
          adminAvatar={adminAvatar}
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={handleMenuToggle}
          orderAlerts={orderAlerts}
        />

        <div className="console-content">
          <ConsoleToastProvider>
            <ConsoleConfirmProvider>
              <Suspense fallback={null}>
                <ConsoleToastListener />
              </Suspense>
              {children}
            </ConsoleConfirmProvider>
          </ConsoleToastProvider>
        </div>
      </div>
    </div>
  );
}
