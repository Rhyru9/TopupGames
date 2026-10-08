"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { StorefrontPopupData } from "@/lib/content/popup-form";
import { isPopupDismissed, setPopupDismissed } from "@/lib/content/popup-dismiss-store";

type StorefrontPopupProps = {
  popup: StorefrontPopupData | null;
};

export function StorefrontPopup({ popup }: StorefrontPopupProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!popup) {
      setVisible(false);
      setReady(false);
      return;
    }

    if (isPopupDismissed(popup.id, popup.updatedAt)) {
      setVisible(false);
      setReady(false);
      return;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 0 : 400;
    const timer = window.setTimeout(() => {
      setVisible(true);
      setReady(true);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [popup]);

  useEffect(() => {
    if (!visible) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close binds latest popup
  }, [visible, popup]);

  function handleClose() {
    if (!popup) return;
    setPopupDismissed(popup.id, popup.updatedAt, popup.dismissMinutes);
    setVisible(false);
  }

  if (!mounted || !popup || !visible) return null;

  const hasHref = Boolean(popup.ctaHref.trim());
  const ctaLabel = popup.ctaLabel.trim() || (popup.mode === "TEXT" ? "Lihat" : "");

  const content =
    popup.mode === "IMAGE" && popup.imageUrl ? (
      hasHref ? (
        <a
          href={popup.ctaHref}
          className="storefront-popup__image-link"
          onClick={handleClose}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={popup.imageUrl}
            alt={popup.title}
            className="storefront-popup__image"
          />
        </a>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={popup.imageUrl}
          alt={popup.title}
          className="storefront-popup__image"
        />
      )
    ) : (
      <div className="storefront-popup__text">
        <h2 id="storefront-popup-title" className="storefront-popup__title">
          {popup.title}
        </h2>
        {popup.body ? <p className="storefront-popup__body">{popup.body}</p> : null}
        {hasHref && ctaLabel ? (
          <a href={popup.ctaHref} className="storefront-popup__cta" onClick={handleClose}>
            {ctaLabel}
          </a>
        ) : null}
      </div>
    );

  return createPortal(
    <div
      className={`storefront-popup${ready ? " storefront-popup--ready" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={popup.mode === "TEXT" ? "storefront-popup-title" : undefined}
      aria-label={popup.mode === "IMAGE" ? popup.title : undefined}
    >
      <button
        type="button"
        className="storefront-popup__backdrop"
        aria-label="Tutup popup"
        onClick={handleClose}
      />
      <div className="storefront-popup__panel">
        <button
          type="button"
          className="storefront-popup__close"
          onClick={handleClose}
          aria-label="Tutup"
        >
          ×
        </button>
        {content}
      </div>
    </div>,
    document.body,
  );
}
