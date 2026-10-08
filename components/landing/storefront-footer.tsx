"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/site/brand-logo";
import { useSiteBranding, type SiteContactLinks } from "@/components/site/site-branding-provider";

type SocialItem = {
  id: keyof SiteContactLinks;
  label: string;
  href: string;
};

function buildSocialItems(contact: SiteContactLinks): SocialItem[] {
  const items: SocialItem[] = [];
  if (contact.instagramUrl.trim()) {
    items.push({ id: "instagramUrl", label: "Instagram", href: contact.instagramUrl });
  }
  if (contact.tiktokUrl.trim()) {
    items.push({ id: "tiktokUrl", label: "TikTok", href: contact.tiktokUrl });
  }
  if (contact.youtubeUrl.trim()) {
    items.push({ id: "youtubeUrl", label: "YouTube", href: contact.youtubeUrl });
  }
  if (contact.facebookUrl.trim()) {
    items.push({ id: "facebookUrl", label: "Facebook", href: contact.facebookUrl });
  }
  return items;
}

function SocialIcon({ id }: { id: SocialItem["id"] }) {
  switch (id) {
    case "instagramUrl":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="storefront-footer__social-svg">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
        </svg>
      );
    case "tiktokUrl":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="storefront-footer__social-svg">
          <path
            d="M15.5 4.5c.4 1.8 1.6 3.2 3.3 3.8v2.8c-1.2.04-2.3-.28-3.3-.9v6.4c0 3.2-2.6 5.2-5.4 5.2-2.8 0-5.1-2.1-5.1-5.1 0-3 2.4-5.1 5.3-5.1.3 0 .7.03 1 .08v3.1c-.2-.08-.5-.12-.8-.12-1.2 0-2.1.9-2.1 2.1s1 2.1 2.2 2.1c1.3 0 2.2-.9 2.2-2.3V4.5h2.9Z"
            fill="currentColor"
          />
        </svg>
      );
    case "youtubeUrl":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="storefront-footer__social-svg">
          <path
            d="M21.6 7.2a2.4 2.4 0 0 0-1.7-1.7C17.8 5 12 5 12 5s-5.8 0-7.9.5A2.4 2.4 0 0 0 2.4 7.2 25 25 0 0 0 2 12a25 25 0 0 0 .4 4.8 2.4 2.4 0 0 0 1.7 1.7c2.1.5 7.9.5 7.9.5s5.8 0 7.9-.5a2.4 2.4 0 0 0 1.7-1.7A25 25 0 0 0 22 12a25 25 0 0 0-.4-4.8Z"
            fill="currentColor"
          />
          <path d="M10.2 15.3V8.7L15.8 12l-5.6 3.3Z" fill="#050505" />
        </svg>
      );
    case "facebookUrl":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className="storefront-footer__social-svg">
          <path
            d="M14 8.5h2.2l-.5 2.7H14v7.3h-3V11.2H9V8.5h2V6.8c0-1.9 1.1-3.3 3.4-3.3.9 0 1.7.07 2 .1v2.6H15c-1 0-1.1.5-1.1 1.2v.2Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
}

const EXPLORE_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Katalog game" },
  { href: "/promo", label: "Promo" },
  { href: "/artikel", label: "Artikel" },
] as const;

const SERVICE_LINKS = [
  { href: "/cek-transaksi", label: "Cek transaksi" },
  { href: "/bantuan", label: "Bantuan" },
] as const;

function FooterIcon({ kind }: { kind: "arrow" | "up" | "price" | "order" | "help" }) {
  const paths = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    up: "M12 19V5m-6 6 6-6 6 6",
    price: "M4 5h10l6 7-8 8-8-7V5Zm4 4h.01",
    order: "M9 4h6m-9 0H5v16h14V4h-1M9 9h6m-6 4h6m-6 4h4",
    help: "M4 14v-3a8 8 0 0 1 16 0v3m-16-1h3v6H4v-6Zm13 0h3v6h-3v-6Zm0 7h-5",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={paths[kind]} /></svg>;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

export function StorefrontFooter() {
  const {
    siteName,
    siteDescription,
    playStoreUrl,
    appStoreUrl,
    footerPages,
    contact,
  } = useSiteBranding();
  const socialItems = buildSocialItems(contact);
  const year = new Date().getFullYear();
  const playUrl = playStoreUrl.trim();
  const appUrl = appStoreUrl.trim();
  const email = contact.email.trim();
  const whatsapp = contact.whatsappUrl.trim();
  const hasContact = Boolean(email || whatsapp || socialItems.length);
  const hasStores = Boolean(playUrl || appUrl);
  const description =
    siteDescription.trim() ||
    `${siteName} menyediakan top up game instant untuk Mobile Legends, Free Fire, dan judul populer lainnya. Harga di etalase sudah final, pembayaran aman, dan proses otomatis setelah transaksi lunas.`;

  return (
    <footer className="storefront-footer" aria-label="Footer situs">
      <div className="storefront-footer__shell">
        <div className="storefront-footer__intro">
          <div>
            <p className="storefront-footer__eyebrow">Game favorit. Satu tempat.</p>
            <h2 className="storefront-footer__title">Siap lanjut bermain?</h2>
            <p className="storefront-footer__intro-text">Temukan game kamu, pilih nominal, dan lanjutkan pembayaran.</p>
          </div>
          <Link href="/produk" className="storefront-footer__cta">
            Jelajahi game <FooterIcon kind="arrow" />
          </Link>
        </div>
        <ul className="storefront-footer__features" aria-label="Layanan R9HOST">
          <li><FooterIcon kind="price" /><span><strong>Harga transparan</strong><span>Lihat total sebelum bayar</span></span></li>
          <li><FooterIcon kind="order" /><span><strong>Pesanan mudah dilacak</strong><span>Pantau lewat cek transaksi</span></span></li>
          <li><FooterIcon kind="help" /><span><strong>Bantuan saat dibutuhkan</strong><span>Panduan dan kontak dukungan</span></span></li>
        </ul>
        <div className="storefront-footer__inner">
          <div className="storefront-footer__brand">
            <Link href="/" className="storefront-footer__logo-link">
              <BrandLogo variant="footer" className="storefront-footer__logo" />
            </Link>
            <p className="storefront-footer__name">{siteName}</p>
            <p className="storefront-footer__tagline">{description}</p>
            {socialItems.length > 0 ? (
              <ul className="storefront-footer__socials" aria-label="Media sosial">
                {socialItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className="storefront-footer__social-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                    >
                      <SocialIcon id={item.id} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav className="storefront-footer__col" aria-label="Jelajah">
            <p className="storefront-footer__heading">Jelajah</p>
            <ul className="storefront-footer__links">
              {EXPLORE_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="storefront-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="storefront-footer__col" aria-label="Layanan">
            <p className="storefront-footer__heading">Layanan</p>
            <ul className="storefront-footer__links">
              {SERVICE_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="storefront-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
              {footerPages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/halaman/${page.slug}`} className="storefront-footer__link">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

            <div className="storefront-footer__col">
              <p className="storefront-footer__heading">Tetap terhubung</p>
              <p className="storefront-footer__contact-text">Ada kendala dengan pesananmu? Kami bantu temukan jawabannya.</p>
              <Link href="/bantuan" className="storefront-footer__support">Pusat bantuan <FooterIcon kind="arrow" /></Link>
              {hasContact ? (
                <ul className="storefront-footer__links">
                  {email ? (
                    <li>
                      <a href={`mailto:${email}`} className="storefront-footer__link">
                        {email}
                      </a>
                    </li>
                  ) : null}
                  {whatsapp ? (
                    <li>
                      <a
                        href={whatsapp}
                        className="storefront-footer__link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              {hasStores ? (
                <div className="storefront-footer__stores">
                  {playUrl ? (
                    <a
                      href={playUrl}
                      className="storefront-footer__store-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Play
                    </a>
                  ) : null}
                  {appUrl ? (
                    <a
                      href={appUrl}
                      className="storefront-footer__store-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      App Store
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
        </div>

        <div className="storefront-footer__bottom">
          <p className="storefront-footer__copy">
            © {year} {siteName}. Seluruh hak cipta dilindungi.
          </p>
          <button type="button" className="storefront-footer__top" onClick={scrollToTop} aria-label="Kembali ke atas halaman"><FooterIcon kind="up" /></button>
          <p className="storefront-footer__legal">
            Seluruh merek, logo, dan aset game adalah milik pemegang hak masing-masing.
          </p>
        </div>
      </div>
    </footer>
  );
}
