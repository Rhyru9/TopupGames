"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Circle / bar hanya muncul jika navigasi masih berjalan setelah delay.
 * Tidak ada “minimum display time” yang membuat loading terasa lebih lama.
 */
const SHOW_IF_SLOW_MS = 220;
const BAR_COMPLETE_MS = 90;
const TICK_MS = 180;
const MAX_PROGRESS = 92;

function sameAppUrl(href: string, pathname: string, search: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return false;
    return `${url.pathname}${url.search}` === `${pathname}${search}`;
  } catch {
    return true;
  }
}

function isInternalNavAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.hasAttribute("download")) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  const rel = anchor.getAttribute("rel") ?? "";
  if (/\bexternal\b/i.test(rel)) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  try {
    return new URL(href, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Circle neon di tengah layar. */
export function NeonLoadingCircle({ className = "" }: { className?: string }) {
  return (
    <div className={`nav-progress__circle-wrap${className ? ` ${className}` : ""}`} aria-hidden>
      <span className="nav-progress__circle-glow" />
      <span className="nav-progress__circle-ring" />
      <span className="nav-progress__circle" />
    </div>
  );
}

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const [barVisible, setBarVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeRef = useRef(false);
  const indicatorsShownRef = useRef(false);
  const tickRef = useRef<number | null>(null);
  const slowTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const cancelTimerRef = useRef<number | null>(null);
  const routeKeyRef = useRef(`${pathname}${search}`);

  function clearTimers() {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (slowTimerRef.current != null) {
      window.clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    if (completeTimerRef.current != null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    if (cancelTimerRef.current != null) {
      window.clearTimeout(cancelTimerRef.current);
      cancelTimerRef.current = null;
    }
  }

  function start() {
    if (activeRef.current) return;
    activeRef.current = true;
    indicatorsShownRef.current = false;
    clearTimers();

    setBarVisible(false);
    setProgress(0);

    slowTimerRef.current = window.setTimeout(() => {
      if (!activeRef.current) return;
      indicatorsShownRef.current = true;
      setBarVisible(true);
      setProgress(18);
      tickRef.current = window.setInterval(() => {
        setProgress((current) => {
          if (current >= MAX_PROGRESS) return current;
          const step = current < 45 ? 10 : current < 75 ? 5 : 2;
          return Math.min(MAX_PROGRESS, current + step);
        });
      }, TICK_MS);
    }, SHOW_IF_SLOW_MS);
    // A cancelled navigation must not leave an indicator behind indefinitely.
    cancelTimerRef.current = window.setTimeout(finish, 30_000);
  }

  function finish() {
    if (!activeRef.current) {
      setBarVisible(false);
      setProgress(0);
      return;
    }

    activeRef.current = false;
    clearTimers();
    if (indicatorsShownRef.current) {
      setProgress(100);
      completeTimerRef.current = window.setTimeout(() => {
        setBarVisible(false);
        setProgress(0);
        indicatorsShownRef.current = false;
      }, BAR_COMPLETE_MS);
      return;
    }

    setBarVisible(false);
    setProgress(0);
    indicatorsShownRef.current = false;
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNavAnchor(anchor)) return;
      if (sameAppUrl(anchor.href, pathname, search)) return;
      start();
    }

    function onPopState() {
      if (`${window.location.pathname}${window.location.search}` === routeKeyRef.current) return;
      start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  useEffect(() => {
    const nextKey = `${pathname}${search}`;
    if (routeKeyRef.current === nextKey) return;
    routeKeyRef.current = nextKey;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  if (!barVisible) return null;

  return (
    <>
      {barVisible ? (
        <div className="nav-progress-bar-root is-visible" aria-hidden>
          <div className="nav-progress__bar" style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      ) : null}
      <span className="sr-only" role="status">Memuat halaman…</span>
    </>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
