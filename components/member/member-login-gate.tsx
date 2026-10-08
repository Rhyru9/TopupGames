"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type GateState = {
  open: boolean;
  nextPath: string;
  productName?: string;
};

type MemberLoginGateContextValue = {
  isMember: boolean;
  openLoginGate: (nextPath: string, productName?: string) => void;
  closeLoginGate: () => void;
};

const MemberLoginGateContext = createContext<MemberLoginGateContextValue | null>(null);

export function useMemberLoginGate() {
  const ctx = useContext(MemberLoginGateContext);
  if (!ctx) {
    throw new Error("useMemberLoginGate must be used within MemberLoginGateProvider");
  }
  return ctx;
}

/** Optional hook — returns null outside provider (e.g. header without provider). */
export function useOptionalMemberLoginGate() {
  return useContext(MemberLoginGateContext);
}

export function MemberLoginGateProvider({
  isMember,
  children,
}: {
  isMember: boolean;
  children: ReactNode;
}) {
  const [gate, setGate] = useState<GateState>({ open: false, nextPath: "/member" });

  const openLoginGate = useCallback((nextPath: string, productName?: string) => {
    setGate({
      open: true,
      nextPath: nextPath.startsWith("/") ? nextPath : `/${nextPath}`,
      productName,
    });
  }, []);

  const closeLoginGate = useCallback(() => {
    setGate((prev) => ({ ...prev, open: false }));
  }, []);

  const value = useMemo(
    () => ({ isMember, openLoginGate, closeLoginGate }),
    [isMember, openLoginGate, closeLoginGate],
  );

  return (
    <MemberLoginGateContext.Provider value={value}>
      {children}
      <MemberLoginGateModal
        open={gate.open}
        nextPath={gate.nextPath}
        productName={gate.productName}
        onClose={closeLoginGate}
      />
    </MemberLoginGateContext.Provider>
  );
}

function MemberLoginGateModal({
  open,
  nextPath,
  productName,
  onClose,
}: {
  open: boolean;
  nextPath: string;
  productName?: string;
  onClose: () => void;
}) {
  if (!open) return null;

  const next = encodeURIComponent(nextPath);
  const masukHref = `/masuk?next=${next}`;
  const daftarHref = `/daftar?next=${next}`;

  return (
    <div className="login-gate" role="dialog" aria-modal="true" aria-labelledby="login-gate-title">
      <button type="button" className="login-gate__backdrop" aria-label="Tutup" onClick={onClose} />
      <div className="login-gate__panel">
        <p className="login-gate__eyebrow">Member only</p>
        <h2 id="login-gate-title" className="login-gate__title">
          Login dulu untuk lanjut
        </h2>
        <p className="login-gate__text">
          {productName ? (
            <>
              <strong>{productName}</strong> hanya bisa dibeli setelah masuk akun member.
            </>
          ) : (
            <>Produk ini hanya bisa dibeli setelah masuk akun member.</>
          )}
        </p>
        <div className="login-gate__actions">
          <Link href={masukHref} className="login-gate__btn login-gate__btn--primary">
            Masuk
          </Link>
          <Link href={daftarHref} className="login-gate__btn login-gate__btn--ghost">
            Daftar
          </Link>
        </div>
        <button type="button" className="login-gate__dismiss" onClick={onClose}>
          Nanti saja
        </button>
      </div>
    </div>
  );
}
