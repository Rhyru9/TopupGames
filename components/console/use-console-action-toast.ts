"use client";

import { useCallback } from "react";
import { useConsoleToast } from "@/components/console/console-toast-provider";

export function useConsoleActionToast() {
  const { showToast } = useConsoleToast();

  const notifySuccess = useCallback(
    (message: string) => showToast(message, "success"),
    [showToast],
  );
  const notifyError = useCallback(
    (message: string) => showToast(message, "error"),
    [showToast],
  );

  return { notifySuccess, notifyError };
}
