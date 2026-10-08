type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listening = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function onBeforeInstall(event: Event) {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  emit();
}

function onInstalled() {
  deferredPrompt = null;
  emit();
}

/** Capture beforeinstallprompt as early as possible (avoids missing the event). */
export function ensurePwaInstallListener() {
  if (typeof window === "undefined" || listening) return;
  listening = true;
  window.addEventListener("beforeinstallprompt", onBeforeInstall);
  window.addEventListener("appinstalled", onInstalled);
}

export function getDeferredInstallPrompt() {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null;
  emit();
}

export function subscribePwaInstallPrompt(listener: Listener) {
  ensurePwaInstallListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isPwaStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean(nav.standalone)
  );
}

const DISMISS_KEY = "r9host-pwa-install-dismissed-until";
const DISMISS_MS = 5 * 60 * 60 * 1000; // 5 jam

export function isPwaInstallDismissed() {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) {
      localStorage.removeItem(DISMISS_KEY);
      return false;
    }
    if (Date.now() >= until) {
      localStorage.removeItem(DISMISS_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function setPwaInstallDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    // bersihkan flag session lama bila ada
    sessionStorage.removeItem("r9host-pwa-install-dismissed");
  } catch {
    /* ignore */
  }
}
