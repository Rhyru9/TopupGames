"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isMobileDockHidden,
  MOBILE_DOCK_MAX_WIDTH,
} from "@/lib/nav/mobile-dock-visibility";
import "@/styles/landing/whatsapp-float.css";

type WhatsappFloatProps = {
  href: string;
  label: string;
};

export function WhatsappFloat({ href, label }: WhatsappFloatProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(false);

  const hiddenByRoute =
    pathname.startsWith("/console") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/member") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/akun");

  const dockVisibleOnMobile = mobileViewport && !isMobileDockHidden(pathname);
  const hidden = hiddenByRoute || dockVisibleOnMobile;

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_DOCK_MAX_WIDTH}px)`);
    const syncViewport = () => setMobileViewport(mq.matches);
    syncViewport();
    mq.addEventListener("change", syncViewport);
    return () => mq.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (hidden) return;
    const timer = window.setTimeout(() => setVisible(true), 280);
    return () => window.clearTimeout(timer);
  }, [hidden]);

  useEffect(() => {
    if (hidden) return;

    const syncLift = () => {
      const hasMobileBar = Boolean(
        document.querySelector(".product-order__mobile-bar, .product-pay__mobile-bar"),
      );
      setLifted(hasMobileBar);
    };

    syncLift();
    const observer = new MutationObserver(syncLift);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [hidden, pathname]);

  if (hidden || !href) return null;

  const text = label || "Chat CS";

  return (
    <div
      className={`wa-float${visible ? " wa-float--visible" : ""}${lifted ? " wa-float--lifted" : ""}`}
    >
      <a
        href={href}
        className="wa-float__link"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={text}
      >
        <span className="wa-float__label">
          <span className="wa-float__label-frame">
            <span className="wa-float__label-card">
              <span className="wa-float__kicker">Bantuan</span>
              <span className="wa-float__text">{text}</span>
            </span>
          </span>
        </span>

        <span className="wa-float__btn" aria-hidden>
          <svg viewBox="0 0 32 32" fill="none">
            <path
              fill="currentColor"
              d="M16.02 4.2c-6.5 0-11.78 5.27-11.78 11.77 0 2.07.54 4.1 1.57 5.88L4.2 27.8l6.15-1.61a11.7 11.7 0 0 0 5.67 1.45h.01c6.5 0 11.78-5.28 11.78-11.78S22.52 4.2 16.02 4.2Zm0 21.5h-.01a9.7 9.7 0 0 1-4.94-1.35l-.35-.21-3.65.96.97-3.56-.23-.37a9.72 9.72 0 0 1-1.49-5.2c0-5.36 4.37-9.72 9.74-9.72 5.36 0 9.72 4.36 9.72 9.72 0 5.37-4.36 9.73-9.76 9.73Zm5.34-7.28c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.59-.9-2.17-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.51.07-.78.37-.27.29-1.02.99-1.02 2.42s1.04 2.81 1.19 3c.15.2 2.05 3.13 4.96 4.39.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.11.55-.08 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.56-.34Z"
            />
          </svg>
        </span>
      </a>
    </div>
  );
}
