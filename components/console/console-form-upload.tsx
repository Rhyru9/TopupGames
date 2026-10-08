"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { uploadImageFile } from "@/lib/storage/upload-client";
import type { UploadKind } from "@/lib/storage/upload-kinds";

export type PendingUploadEntry = {
  name: string;
  kind: UploadKind;
  file: File;
};

type FormUploadContextValue = {
  registerPending: (entry: PendingUploadEntry) => () => void;
  pendingRef: RefObject<Map<string, PendingUploadEntry>>;
};

const FormUploadContext = createContext<FormUploadContextValue | null>(null);

export function ConsoleFormUploadProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<Map<string, PendingUploadEntry>>(new Map());

  const registerPending = useCallback((entry: PendingUploadEntry) => {
    pendingRef.current.set(entry.name, entry);
    return () => {
      pendingRef.current.delete(entry.name);
    };
  }, []);

  return (
    <FormUploadContext.Provider value={{ registerPending, pendingRef }}>
      {children}
    </FormUploadContext.Provider>
  );
}

export function useConsoleFormUploadRegister() {
  return useContext(FormUploadContext);
}

export function useConsoleFormUploadSubmit(formAction: (formData: FormData) => void) {
  const context = useContext(FormUploadContext);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const skipRef = useRef(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }

    const pending = context?.pendingRef.current;
    if (!pending || pending.size === 0) return;

    event.preventDefault();
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData(event.currentTarget);

      for (const entry of pending.values()) {
        const path = await uploadImageFile(entry.kind, entry.file);
        formData.set(entry.name, path);
      }

      pending.clear();
      skipRef.current = true;
      startTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload gambar gagal.");
    } finally {
      setIsUploading(false);
    }
  };

  return { onSubmit, isUploading, uploadError };
}
