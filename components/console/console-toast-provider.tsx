"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ConsoleToastVariant } from "@/lib/console-toast";

export type { ConsoleToastVariant };

export type ConsoleToastItem = {
  id: string;
  message: string;
  variant: ConsoleToastVariant;
};

type ConsoleToastContextValue = {
  toasts: ConsoleToastItem[];
  showToast: (message: string, variant?: ConsoleToastVariant) => void;
  dismissToast: (id: string) => void;
};

const ConsoleToastContext = createContext<ConsoleToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

export function ConsoleToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ConsoleToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ConsoleToastVariant = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current, { id, message, variant }]);

      const timer = setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
      timersRef.current.set(id, timer);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ConsoleToastContext.Provider value={value}>
      {children}
      <div className="console-toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`console-toast console-toast--${toast.variant}`}
            role="status"
          >
            <p className="console-toast__message">{toast.message}</p>
            <button
              type="button"
              className="console-toast__close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Tutup notifikasi"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ConsoleToastContext.Provider>
  );
}

export function useConsoleToast() {
  const context = useContext(ConsoleToastContext);
  if (!context) {
    throw new Error("useConsoleToast must be used within ConsoleToastProvider");
  }
  return context;
}
