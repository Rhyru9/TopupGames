"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FooterContentPageLink } from "@/lib/content/get-footer-content-pages";
import {
  defaultLogoFooterUrl,
  defaultLogoHeaderUrl,
  defaultSiteGeneral,
  defaultSiteSeo,
} from "@/lib/site-settings/site-settings-schemas";

export type SiteContactLinks = {
  email: string;
  whatsappUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
};

type SiteBranding = {
  logoHeaderUrl: string;
  logoFooterUrl: string;
  siteName: string;
  siteDescription: string;
  playStoreUrl: string;
  appStoreUrl: string;
  footerPages: FooterContentPageLink[];
  contact: SiteContactLinks;
};

const defaultContact: SiteContactLinks = {
  email: defaultSiteGeneral.email,
  whatsappUrl: defaultSiteGeneral.whatsappUrl,
  instagramUrl: defaultSiteGeneral.instagramUrl,
  tiktokUrl: defaultSiteGeneral.tiktokUrl,
  youtubeUrl: defaultSiteGeneral.youtubeUrl,
  facebookUrl: defaultSiteGeneral.facebookUrl,
};

const SiteBrandingContext = createContext<SiteBranding>({
  logoHeaderUrl: defaultLogoHeaderUrl,
  logoFooterUrl: defaultLogoFooterUrl,
  siteName: defaultSiteGeneral.siteName,
  siteDescription: defaultSiteSeo.metaDescription,
  playStoreUrl: defaultSiteGeneral.playStoreUrl,
  appStoreUrl: defaultSiteGeneral.appStoreUrl,
  footerPages: [],
  contact: defaultContact,
});

type SiteBrandingProviderProps = {
  children: ReactNode;
  logoHeaderUrl: string;
  logoFooterUrl: string;
  siteName: string;
  siteDescription: string;
  playStoreUrl: string;
  appStoreUrl: string;
  footerPages: FooterContentPageLink[];
  contact: SiteContactLinks;
};

export function SiteBrandingProvider({
  children,
  logoHeaderUrl,
  logoFooterUrl,
  siteName,
  siteDescription,
  playStoreUrl,
  appStoreUrl,
  footerPages,
  contact,
}: SiteBrandingProviderProps) {
  return (
    <SiteBrandingContext.Provider
      value={{
        logoHeaderUrl,
        logoFooterUrl,
        siteName,
        siteDescription,
        playStoreUrl,
        appStoreUrl,
        footerPages,
        contact,
      }}
    >
      {children}
    </SiteBrandingContext.Provider>
  );
}

export function useSiteBranding(): SiteBranding {
  return useContext(SiteBrandingContext);
}
