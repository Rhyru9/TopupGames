export const CONSOLE_SIDEBAR_KEY = "r9host-console-sidebar-collapsed";

/** Blocking script — sidebar collapse state sebelum paint. Aman di storefront. */
export const CONSOLE_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("r9host-console-sidebar-collapsed");document.documentElement.dataset.consoleSidebarCollapsed=s==="1"?"1":"0";}catch(e){document.documentElement.dataset.consoleSidebarCollapsed="0";}})();`;

export function getStoredSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.consoleSidebarCollapsed === "1") return true;
  return localStorage.getItem(CONSOLE_SIDEBAR_KEY) === "1";
}
