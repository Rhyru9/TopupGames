"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

type GoogleTagsProps = {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
};

/** Hanya izinkan ID yang sudah divalidasi di form — hindari injeksi script. */
function safeGaId(raw: string): string | null {
  const id = raw.trim();
  if (!/^(G-[A-Z0-9]+|UA-\d+-\d+)$/i.test(id)) return null;
  return id;
}

function safeGtmId(raw: string): string | null {
  const id = raw.trim();
  if (!/^GTM-[A-Z0-9]+$/i.test(id)) return null;
  return id;
}

/**
 * Inject GA4 / GTM di storefront saja (skip /console).
 */
export function GoogleTags({
  googleAnalyticsId = "",
  googleTagManagerId = "",
}: GoogleTagsProps) {
  const pathname = usePathname();
  if (pathname.startsWith("/console")) return null;

  const gaId = safeGaId(googleAnalyticsId);
  const gtmId = safeGtmId(googleTagManagerId);
  if (!gaId && !gtmId) return null;

  return (
    <>
      {gtmId ? (
        <>
          <Script id="r9host-gtm" strategy="afterInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');
          `}</Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      ) : null}

      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="r9host-ga4" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');
          `}</Script>
        </>
      ) : null}
    </>
  );
}
