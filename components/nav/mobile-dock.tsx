"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { isMobileDockHidden } from "@/lib/nav/mobile-dock-visibility";
import { defaultDockLogoUrl } from "@/lib/site-settings/site-settings-schemas";
import "@/styles/landing/mobile-dock.css";

type DockItem = {
  id: string;
  href: string;
  label: string;
  external?: boolean;
  match: (pathname: string, hash: string) => boolean;
};

function IconGame() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M4.8 8.2h14.4c1.7 0 3 1.5 2.8 3.2l-.7 4.4A3.2 3.2 0 0 1 18.2 18.8H5.8a3.2 3.2 0 0 1-3.1-2.99l-.7-4.4c-.2-1.7 1.1-3.2 2.8-3.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M8.2 11.6v4M6.2 13.6h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="15.1" cy="12.4" r="1.05" fill="currentColor" />
      <circle cx="17.4" cy="14.7" r="1.05" fill="currentColor" />
    </svg>
  );
}

function IconPromo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M5.2 9.4 9.4 5.2h5.2L18.8 9.4v5.2L14.6 18.8H9.4L5.2 14.6V9.4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="9.6" cy="9.6" r="1.15" stroke="currentColor" strokeWidth="1.6" />
      <path d="m10.7 13.5 3.2-3.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconCek() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M7.2 4.8h6.8L17.2 8v11.2H7.2A1.4 1.4 0 0 1 5.8 17.8V6.2A1.4 1.4 0 0 1 7.2 4.8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M13.8 5V8h3.1" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M8.4 11.6h7M8.4 14.8h4.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconCs() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M18.72 14.76c.35-.85.54-1.76.54-2.76c0-.72-.11-1.41-.3-2.05c-.65.15-1.33.23-2.04.23A9.07 9.07 0 0 1 9.5 6.34a9.2 9.2 0 0 1-4.73 4.88c-.04.25-.04.52-.04.78A7.27 7.27 0 0 0 12 19.27c1.05 0 2.06-.23 2.97-.64c.57 1.09.83 1.63.81 1.63c-1.64.55-2.91.82-3.78.82c-2.42 0-4.73-.95-6.43-2.66a9 9 0 0 1-2.24-3.69H2v-4.55h1.09a9.09 9.09 0 0 1 15.33-4.6a9 9 0 0 1 2.47 4.6H22v4.55h-.06L18.38 18l-5.3-.6v-1.67h4.83zm-9.45-2.99c.3 0 .59.12.8.34a1.136 1.136 0 0 1 0 1.6c-.21.21-.5.33-.8.33c-.63 0-1.14-.5-1.14-1.13s.51-1.14 1.14-1.14m5.45 0c.63 0 1.13.51 1.13 1.14s-.5 1.13-1.13 1.13s-1.14-.5-1.14-1.13a1.14 1.14 0 0 1 1.14-1.14" />
    </svg>
  );
}

const icons: Record<string, () => ReactNode> = {
  game: () => <IconGame />,
  promo: () => <IconPromo />,
  cek: () => <IconCek />,
  bantuan: () => <IconCs />,
};

function buildItems(isMember: boolean, showBantuan: boolean): DockItem[] {
  const items: DockItem[] = [
    {
      id: "game",
      href: "/produk",
      label: "Game",
      match: (pathname) => pathname === "/produk",
    },
    {
      id: "promo",
      href: "/promo",
      label: "Promo",
      match: (pathname) => pathname === "/promo",
    },
    {
      id: "cek",
      href: isMember ? "/member/riwayat" : "/cek-transaksi",
      label: isMember ? "Riwayat" : "Cek",
      match: (pathname) =>
        pathname === "/cek-transaksi" ||
        pathname.startsWith("/member/riwayat") ||
        pathname.startsWith("/invoice/"),
    },
  ];

  if (showBantuan) {
    items.push({
      id: "bantuan",
      href: "/bantuan",
      label: "Bantuan",
      match: (pathname) => pathname === "/bantuan",
    });
  }

  return items;
}

export function MobileDock({
  logoUrl = defaultDockLogoUrl,
  showPromoDot = false,
  showBantuan = false,
  isMember = false,
}: {
  logoUrl?: string;
  showPromoDot?: boolean;
  showBantuan?: boolean;
  isMember?: boolean;
}) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  const hidden = isMobileDockHidden(pathname);

  const items = buildItems(isMember, showBantuan);
  const left = items.slice(0, 2);
  const right = items.slice(2);
  const homeActive = pathname === "/";

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash || "");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  if (hidden) return null;

  function renderItem(item: DockItem) {
    const active = item.match(pathname, hash);
    const className = `mobile-dock__item${active ? " is-active" : ""}${
      item.id === "promo" && showPromoDot ? " has-dot" : ""
    }`;
    const content = (
      <>
        <span className="mobile-dock__icon">
          {icons[item.id]()}
          {item.id === "promo" && showPromoDot ? (
            <span className="mobile-dock__dot" aria-hidden />
          ) : null}
        </span>
        <span className="mobile-dock__label">{item.label}</span>
      </>
    );

    if (item.external) {
      return (
        <a
          key={item.id}
          href={item.href}
          className={className}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        className={className}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <nav className="mobile-dock" aria-label="Navigasi utama">
      <div className="mobile-dock__shell">
        <div className="mobile-dock__glow" aria-hidden />
        <div className="mobile-dock__bar">
          <div className="mobile-dock__neon mobile-dock__neon--top" aria-hidden />
          <div className="mobile-dock__neon mobile-dock__neon--bottom" aria-hidden />

          <div className="mobile-dock__side">{left.map(renderItem)}</div>

          <div className="mobile-dock__hub-space" aria-hidden />

          <div className="mobile-dock__side">{right.map(renderItem)}</div>
        </div>

        <Link
          href="/"
          className={`mobile-dock__hub${homeActive ? " is-active" : ""}`}
          aria-label="Beranda"
          aria-current={homeActive ? "page" : undefined}
        >
          <span className="mobile-dock__hub-ring" aria-hidden />
          <span className="mobile-dock__hub-core">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" width={2170} height={725} className="mobile-dock__hub-logo" />
          </span>
          <span className="mobile-dock__hub-caret" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
