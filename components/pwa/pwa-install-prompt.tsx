"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  isPwaInstallDismissed,
  isPwaStandalone,
  setPwaInstallDismissed,
  subscribePwaInstallPrompt,
} from "@/lib/pwa/install-prompt-store";
import "@/styles/landing/pwa-install.css";

type PwaInstallPromptProps = {
  enabled: boolean;
  appName?: string;
  iconUrl?: string;
};

const MOBILE_MQ = "(max-width: 768px), (pointer: coarse) and (max-width: 1024px)";

function subscribeMobile(onStoreChange: () => void) {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function getServerMobileSnapshot() {
  return false;
}

function subscribeDeferred(onStoreChange: () => void) {
  return subscribePwaInstallPrompt(onStoreChange);
}

function getDeferredSnapshot() {
  return getDeferredInstallPrompt();
}

function getServerDeferredSnapshot() {
  return null;
}

export function PwaInstallPrompt({
  enabled,
  appName = "aplikasi",
  iconUrl = "",
}: PwaInstallPromptProps) {
  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getServerMobileSnapshot);
  const deferred = useSyncExternalStore(
    subscribeDeferred,
    getDeferredSnapshot,
    getServerDeferredSnapshot,
  );
  const [dismissed, setDismissed] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setStandalone(isPwaStandalone());
    setDismissed(isPwaInstallDismissed());
  }, []);

  if (!enabled || !isMobile || standalone || dismissed || !deferred) return null;

  async function handleInstall() {
    const promptEvent = deferred ?? getDeferredInstallPrompt();
    if (!promptEvent) return;

    setInstalling(true);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      clearDeferredInstallPrompt();
      if (choice.outcome === "accepted") {
        setPwaInstallDismissed();
        setDismissed(true);
      }
    } finally {
      setInstalling(false);
    }
  }

  function handleDismiss() {
    setPwaInstallDismissed();
    setDismissed(true);
  }

  return (
    <div className="pwa-install" role="region" aria-label="Install aplikasi">
      <div className="pwa-install__frame">
        <div className="pwa-install__card">
          <button
            type="button"
            className="pwa-install__close"
            onClick={handleDismiss}
            aria-label="Tutup"
          >
            ×
          </button>

          <div className="pwa-install__main">
            <span className="pwa-install__logo" aria-hidden>
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconUrl} alt="" className="pwa-install__logo-img" />
              ) : (
                <span className="pwa-install__logo-fallback">OT</span>
              )}
            </span>

            <div className="pwa-install__copy">
              <p className="pwa-install__kicker">Install app</p>
              <p className="pwa-install__text">Install {appName}</p>
            </div>

            <button
              type="button"
              className="pwa-install__btn"
              onClick={() => void handleInstall()}
              disabled={installing}
            >
              {installing ? "..." : "Install"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
