"use client";

import {
  useConsoleToast,
} from "@/components/console/console-toast-provider";
import type { ConsoleToastVariant } from "@/lib/console-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function parseToastVariant(value: string | null): ConsoleToastVariant {
  return value === "error" ? "error" : "success";
}

export function ConsoleToastListener() {
  const { showToast } = useConsoleToast();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const toastMessage = searchParams.get("toast");
    if (!toastMessage) {
      handledRef.current = null;
      return;
    }

    const signature = `${pathname}?${searchParams.toString()}`;
    if (handledRef.current === signature) return;
    handledRef.current = signature;

    showToast(toastMessage, parseToastVariant(searchParams.get("toastVariant")));

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("toast");
    nextParams.delete("toastVariant");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, showToast]);

  return null;
}
