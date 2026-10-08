"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type ConsoleIconButtonProps = {
  href?: string;
  title: string;
  variant?: "default" | "accent" | "danger" | "fire" | "fire-active";
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

export function ConsoleIconButton({
  href,
  title,
  variant = "default",
  children,
  type = "button",
  disabled,
  onClick,
}: ConsoleIconButtonProps) {
  const className = `console-icon-btn console-icon-btn--${variant}`;

  if (href) {
    return (
      <Link href={href} className={className} title={title} aria-label={title}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={className}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ConsoleIconView() {
  return (
    <svg viewBox="0 0 24 24" className="console-icon-btn__svg" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function ConsoleIconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="console-icon-btn__svg" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ConsoleIconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="console-icon-btn__svg" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
      <path d="M6 7l1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9l1-12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
    </svg>
  );
}

export function ConsoleIconFire({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="console-icon-btn__svg"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
