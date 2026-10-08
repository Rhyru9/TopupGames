function dismissKey(popupId: string, updatedAt: string) {
  return `r9host-popup-dismissed:${popupId}:${updatedAt}`;
}

export function isPopupDismissed(popupId: string, updatedAt: string) {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(dismissKey(popupId, updatedAt));
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) {
      localStorage.removeItem(dismissKey(popupId, updatedAt));
      return false;
    }
    if (Date.now() >= until) {
      localStorage.removeItem(dismissKey(popupId, updatedAt));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function setPopupDismissed(popupId: string, updatedAt: string, dismissMinutes: number) {
  try {
    const minutes = Math.max(1, Math.floor(dismissMinutes) || 5);
    localStorage.setItem(
      dismissKey(popupId, updatedAt),
      String(Date.now() + minutes * 60 * 1000),
    );
  } catch {
    /* ignore */
  }
}
