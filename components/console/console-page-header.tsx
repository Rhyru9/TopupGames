import Link from "next/link";
import type { ReactNode } from "react";

export type ConsolePageHeaderAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type ConsolePageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /** @deprecated Prefer `actions` */
  action?: ConsolePageHeaderAction;
  actions?: ConsolePageHeaderAction[];
  actionsSlot?: ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
};

export function ConsolePageHeader({
  eyebrow,
  title,
  description,
  action,
  actions,
  actionsSlot,
  backLink,
}: ConsolePageHeaderProps) {
  const resolvedActions = actions ?? (action ? [action] : []);

  return (
    <div className="console-page-header">
      <div className="console-page-header__main">
        {backLink ? (
          <Link href={backLink.href} className="console-page-header__back">
            {backLink.label}
          </Link>
        ) : null}
        {eyebrow ? <p className="console-page-intro__eyebrow">{eyebrow}</p> : null}
        <h1 className="console-page-header__title">{title}</h1>
        {description ? <p className="console-page-header__text">{description}</p> : null}
      </div>
      {resolvedActions.length > 0 || actionsSlot ? (
        <div className="console-page-header__actions">
          {actionsSlot}
          {resolvedActions.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={
                item.variant === "primary"
                  ? "console-btn-primary console-page-header__action"
                  : "console-btn-secondary console-page-header__action"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
