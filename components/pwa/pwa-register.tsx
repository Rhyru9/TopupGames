"use client";

import { useEffect } from "react";
import { ensurePwaInstallListener } from "@/lib/pwa/install-prompt-store";

type PwaRegisterProps = {
  enabled: boolean;
};

export function PwaRegister({ enabled }: PwaRegisterProps) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    ensurePwaInstallListener();

    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    void navigator.serviceWorker.register("/sw.js").catch((error) => {
      if (!cancelled) {
        console.warn("[pwa] service worker registration failed", error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return null;
}
