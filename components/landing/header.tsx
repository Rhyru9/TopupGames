"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSiteBranding } from "@/components/site/site-branding-provider";
import { BrandLogo } from "@/components/site/brand-logo";

const defaultLinks: {
  href: string;
  label: string;
  absolute?: boolean;
  memberHref?: string;
  memberLabel?: string;
}[] = [
  { href: "/", label: "Beranda", absolute: true },
  { href: "/produk", label: "Game", absolute: true },
  { href: "/promo", label: "Promo", absolute: true },
  {
    href: "/cek-transaksi",
    label: "Cek transaksi",
    absolute: true,
    memberHref: "/member/riwayat",
    memberLabel: "Riwayat",
  },
];

type HeaderProps = {
  /** Logo + home target. Landing: `#hero`, product: `/`. */
  homeHref?: string;
  /** Prefix for hash nav links, e.g. `/` → `/#katalog`. */
  navPrefix?: string;
  hideSearch?: boolean;
  /** Always solid background (product / inner pages). */
  forceSolid?: boolean;
  /** Logged-in member display name — switches Masuk → Akun. */
  memberName?: string | null;
  /** Logged-in member avatar URL. */
  memberImage?: string | null;
};

type SearchHit = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  thumbnailUrl: string;
  categoryName: string;
  requiresLogin?: boolean;
};

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" className="h-[1.15rem] w-[1.15rem]">
      <circle cx="11" cy="11" r="6.2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M15.8 15.8 19.5 19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" className="h-[1.15rem] w-[1.15rem]">
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.4 19.2c.85-3 3.15-4.8 6.6-4.8s5.75 1.8 6.6 4.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header({
  homeHref = "/",
  navPrefix = "",
  hideSearch = false,
  forceSolid = false,
  memberName = null,
  memberImage = null,
}: HeaderProps) {
  const { siteName } = useSiteBranding();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchButton = useRef<HTMLButtonElement>(null);
  const brandName = siteName.trim() || "R9host";

  const loggedIn = Boolean(memberName);
  const links = defaultLinks.map((link) => {
    const useMember = loggedIn && Boolean(link.memberHref);
    const href = useMember
      ? link.memberHref!
      : link.absolute
        ? link.href
        : `${navPrefix}${link.href}`;
    return {
      href,
      label: useMember && link.memberLabel ? link.memberLabel : link.label,
    };
  });
  const authHref = loggedIn ? "/member" : "/masuk";
  const authLabel = loggedIn
    ? memberName!.trim().split(/\s+/)[0]?.slice(0, 12) || "Member"
    : "Masuk";
  const avatarInitial = (memberName?.trim().charAt(0) || "M").toUpperCase();

  useEffect(() => {
    if (forceSolid) return;

    let lastScrolled: boolean | null = null;
    const sync = () => {
      const nextScrolled = window.scrollY > 8;
      if (nextScrolled === lastScrolled) return;
      lastScrolled = nextScrolled;
      setScrolled(nextScrolled);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [forceSolid]);

  const solid = forceSolid || scrolled || mobileSearchOpen;

  return (
    <header className="site-dock-wrap">
      <div className={`site-dock${solid ? " is-solid" : ""}`}>
        <Link href={homeHref} className="site-dock__brand" aria-label={`${brandName} — Beranda`}>
          <BrandLogo className="site-dock__logo" priority alt="" />
        </Link>

        {!hideSearch ? (
          <HeaderSearch
            id="game-search"
            query={query}
            setQuery={setQuery}
            className="site-dock__search hidden lg:block"
          />
        ) : (
          <div className="hidden min-w-0 flex-1 lg:block" />
        )}

        <nav className="site-dock__nav" aria-label="Navigasi utama">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`site-dock__link${active ? " is-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-dock__actions">
          {loggedIn ? (
            <Link
              href={authHref}
              className="site-dock__avatar"
              aria-label={`Profil ${authLabel}`}
              title={authLabel}
            >
              {memberImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={memberImage} alt="" />
              ) : (
                <span aria-hidden>{avatarInitial}</span>
              )}
            </Link>
          ) : (
            <Link href={authHref} className="site-dock__cta">
              {authLabel}
            </Link>
          )}
        </div>

        <div className="site-dock__mobile">
          {!hideSearch ? (
            <button
              ref={mobileSearchButton}
              type="button"
              className={`site-dock__icon-btn${mobileSearchOpen ? " is-active" : ""}`}
              aria-label="Cari game"
              aria-expanded={mobileSearchOpen}
              aria-controls="site-mobile-search"
              onClick={() => setMobileSearchOpen((open) => !open)}
            >
              <IconSearch />
            </button>
          ) : null}
          <Link
            href={authHref}
            className="site-dock__icon-btn"
            aria-label={loggedIn ? `Profil ${authLabel}` : "Masuk"}
            title={loggedIn ? authLabel : "Masuk"}
          >
            {loggedIn && memberImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={memberImage} alt="" className="h-full w-full rounded-full object-cover" />
            ) : loggedIn ? (
              <span aria-hidden>{avatarInitial}</span>
            ) : (
              <IconProfile />
            )}
          </Link>
        </div>
      </div>

      {mobileSearchOpen && !hideSearch ? (
        <div
          id="site-mobile-search"
          className="site-dock__mobile-search lg:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMobileSearchOpen(false);
              mobileSearchButton.current?.focus({ preventScroll: true });
            }
          }}
        >
          <HeaderSearch
            id="game-search-mobile"
            query={query}
            setQuery={setQuery}
            variant="mobile"
            onNavigate={() => setMobileSearchOpen(false)}
          />
        </div>
      ) : null}
    </header>
  );
}

function HeaderSearch({
  id,
  query,
  setQuery,
  className,
  variant = "default",
  onNavigate,
}: {
  id: string;
  query: string;
  setQuery: (value: string) => void;
  className?: string;
  variant?: "default" | "mobile";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const reqId = useRef(0);
  const hasQuery = query.trim().length > 0;
  const panelOpen = hasQuery && open;
  const panelLoading = hasQuery && loading;
  const panelResults = hasQuery ? results : [];
  const panelActiveIndex = hasQuery ? activeIndex : -1;

  useEffect(() => {
    if (variant === "mobile") inputRef.current?.focus({ preventScroll: true });
  }, [variant]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      document.getElementById(`${listId}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
  }, [activeIndex, listId, open]);

  useEffect(() => {
    const q = query.trim();
    const idNow = ++reqId.current;
    if (q.length < 1) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error("search failed");
          return (await res.json()) as { results?: SearchHit[] };
        })
        .then((data) => {
          if (idNow !== reqId.current) return;
          const next = Array.isArray(data.results) ? data.results : [];
          setResults(next);
          setOpen(true);
          setActiveIndex(next.length > 0 ? 0 : -1);
        })
        .catch(() => {
          if (idNow !== reqId.current || controller.signal.aborted) return;
          setFailed(true);
          setResults([]);
          setOpen(true);
          setActiveIndex(-1);
        })
        .finally(() => {
          if (idNow === reqId.current) setLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function goToProduct(hit: SearchHit) {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(`/produk/${hit.slug}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    const target =
      (panelActiveIndex >= 0 ? panelResults[panelActiveIndex] : undefined) ??
      panelResults.find((item) => item.name.toLowerCase() === q.toLowerCase()) ??
      panelResults[0];
    if (target) {
      goToProduct(target);
      return;
    }

    onNavigate?.();
    router.push("/produk");
  }

  return (
    <div ref={rootRef} data-variant={variant} className={`relative ${className ?? ""}`}>
      <form onSubmit={onSubmit}>
        <label className="sr-only" htmlFor={id}>
          Cari game
        </label>
        <div className="site-dock__field">
          <span className="site-dock__field-icon" aria-hidden>
            <IconSearch />
          </span>
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={panelOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              panelActiveIndex >= 0 ? `${listId}-option-${panelActiveIndex}` : undefined
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setResults([]);
              setOpen(Boolean(e.target.value.trim()));
              setLoading(Boolean(e.target.value.trim()));
              setFailed(false);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (hasQuery) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                return;
              }
              if (!panelOpen || panelResults.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % panelResults.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => (i <= 0 ? panelResults.length - 1 : i - 1));
              }
            }}
            placeholder="Cari game (ML, Free Fire, Genshin...)"
            className="site-dock__input"
            autoComplete="off"
          />
          <button type="submit" className="site-dock__search-submit">
            Cari
          </button>
        </div>
      </form>

      {panelOpen ? (
        <ul id={listId} role="listbox" className="site-dock__results">
          {panelLoading ? (
            <li role="presentation" className="px-3 py-3 text-sm text-chrome-dim"><span role="status">Mencari...</span></li>
          ) : failed ? (
            <li role="presentation" className="px-3 py-3 text-sm text-chrome-dim"><span role="status">Pencarian belum tersedia. Coba lagi atau buka katalog game.</span></li>
          ) : panelResults.length === 0 ? (
            <li role="presentation" className="px-3 py-3 text-sm text-chrome-dim"><span role="status">Tidak ada hasil ditemukan</span></li>
          ) : (
            panelResults.map((hit, index) => (
              <li key={hit.id} id={`${listId}-option-${index}`} role="option" aria-selected={index === panelActiveIndex}>
                <Link
                  href={`/produk/${hit.slug}`}
                  className={`site-dock__result${index === panelActiveIndex ? " is-active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    onNavigate?.();
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={hit.thumbnailUrl} alt="" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-chrome">
                      {hit.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-chrome-dim">
                      {hit.categoryName}
                      {hit.subtitle ? ` · ${hit.subtitle}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
