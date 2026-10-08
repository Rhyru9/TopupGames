"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ConsoleConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
};

export type ConsoleAlertOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "default" | "danger";
};

type PendingDialog =
  | (ConsoleConfirmOptions & {
      kind: "confirm";
      resolve: (confirmed: boolean) => void;
    })
  | (ConsoleAlertOptions & {
      kind: "alert";
      resolve: () => void;
    });

type ConsoleConfirmContextValue = {
  confirm: (options: ConsoleConfirmOptions) => Promise<boolean>;
  alert: (options: ConsoleAlertOptions) => Promise<void>;
};

const ConsoleConfirmContext = createContext<ConsoleConfirmContextValue | null>(null);

export function ConsoleConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDialog | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const closeConfirm = useCallback((confirmed: boolean) => {
    setPending((current) => {
      if (current?.kind === "confirm") current.resolve(confirmed);
      return null;
    });
  }, []);

  const closeAlert = useCallback(() => {
    setPending((current) => {
      if (current?.kind === "alert") current.resolve();
      return null;
    });
  }, []);

  const confirm = useCallback((options: ConsoleConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, kind: "confirm", resolve });
    });
  }, []);

  const alert = useCallback((options: ConsoleAlertOptions) => {
    return new Promise<void>((resolve) => {
      setPending({ ...options, kind: "alert", resolve });
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    const kind = pending.kind;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (kind === "alert") closeAlert();
      else closeConfirm(false);
    }

    document.addEventListener("keydown", onKeyDown);
    confirmButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [pending, closeAlert, closeConfirm]);

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);
  const isAlert = pending?.kind === "alert";

  return (
    <ConsoleConfirmContext.Provider value={value}>
      {children}
      {pending ? (
        <div
          className="console-modal-overlay"
          role="presentation"
          onClick={() => (isAlert ? closeAlert() : closeConfirm(false))}
        >
          <div
            className="console-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="console-confirm-title"
            aria-describedby={pending.description ? "console-confirm-desc" : undefined}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="console-modal__head">
              <h2 id="console-confirm-title" className="console-modal__title">
                {pending.title}
              </h2>
            </div>
            <div className="console-modal__body">
              {pending.description ? (
                <p id="console-confirm-desc" className="console-modal__text">
                  {pending.description}
                </p>
              ) : null}
            </div>
            <div className="console-modal__actions">
              {!isAlert ? (
                <button
                  type="button"
                  className="console-btn-ghost"
                  onClick={() => closeConfirm(false)}
                >
                  {pending.kind === "confirm" ? (pending.cancelLabel ?? "Batal") : "Batal"}
                </button>
              ) : null}
              <button
                ref={confirmButtonRef}
                type="button"
                className={
                  pending.variant === "danger"
                    ? "console-btn-primary console-btn-primary--danger"
                    : "console-btn-primary"
                }
                onClick={() => (isAlert ? closeAlert() : closeConfirm(true))}
              >
                {isAlert
                  ? (pending.confirmLabel ?? "OK")
                  : pending.kind === "confirm"
                    ? (pending.confirmLabel ?? "Konfirmasi")
                    : "OK"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConsoleConfirmContext.Provider>
  );
}

export function useConsoleConfirm() {
  const context = useContext(ConsoleConfirmContext);
  if (!context) {
    throw new Error("useConsoleConfirm must be used within ConsoleConfirmProvider");
  }
  return context.confirm;
}

export function useConsoleAlert() {
  const context = useContext(ConsoleConfirmContext);
  if (!context) {
    throw new Error("useConsoleAlert must be used within ConsoleConfirmProvider");
  }
  return context.alert;
}
