import Link from "next/link";
import { WebsiteAuthForm } from "@/components/console/website/website-auth-form";
import { WebsiteCronPanel } from "@/components/console/website/website-cron-panel";
import { WebsiteGeneralForm } from "@/components/console/website/website-general-form";
import { WebsiteMailForm } from "@/components/console/website/website-mail-form";
import { WebsitePwaForm } from "@/components/console/website/website-pwa-form";
import { WebsiteSeoForm } from "@/components/console/website/website-seo-form";
import { WebsiteStorageForm } from "@/components/console/website/website-storage-form";
import { WebsiteStyleForm } from "@/components/console/website/website-style-form";
import {
  isGoogleLoginConfigured,
  isMailConfigured,
  isStorageConfigured,
  websiteSettingSections,
  type SiteAuthSettings,
  type SiteGeneralSettings,
  type SiteMailSettings,
  type SitePwaSettings,
  type SiteSeoSettings,
  type SiteStorageSettings,
  type SiteStyleSettings,
  type WebsiteSettingSection,
} from "@/lib/site-settings/site-settings-schemas";

type WebsiteSettingsPanelProps = {
  selectedSection: WebsiteSettingSection;
  general: SiteGeneralSettings;
  seo: SiteSeoSettings;
  storage: SiteStorageSettings;
  style: SiteStyleSettings;
  pwa: SitePwaSettings;
  auth: SiteAuthSettings;
  mail: SiteMailSettings;
  googleCallbackUrl: string;
  cronBaseUrl: string;
  cronSecretConfigured: boolean;
  cronSecretDisplay: string;
  cronSecretSource: "database" | "env" | "none";
};

function sectionStatus(
  section: WebsiteSettingSection,
  storage: SiteStorageSettings,
  auth: SiteAuthSettings,
  mail: SiteMailSettings,
  cronSecretConfigured: boolean,
): string {
  if (section === "storage") {
    return isStorageConfigured(storage) ? "Siap" : "Perlu konfigurasi";
  }
  if (section === "auth") {
    return isGoogleLoginConfigured(auth) ? "Google aktif" : "Opsional";
  }
  if (section === "mail") {
    return isMailConfigured(mail) ? "SMTP aktif" : "Perlu konfigurasi";
  }
  if (section === "cron") {
    return cronSecretConfigured ? "Secret siap" : "Perlu CRON_SECRET";
  }
  return "Form";
}

function sectionBadgeClass(
  section: WebsiteSettingSection,
  storage: SiteStorageSettings,
  auth: SiteAuthSettings,
  mail: SiteMailSettings,
  cronSecretConfigured: boolean,
): string {
  if (section === "storage" && !isStorageConfigured(storage)) {
    return "console-badge--muted";
  }
  if (section === "auth" && auth.googleEnabled && !isGoogleLoginConfigured(auth)) {
    return "console-badge--muted";
  }
  if (section === "auth" && isGoogleLoginConfigured(auth)) {
    return "console-badge--success";
  }
  if (section === "mail") {
    return isMailConfigured(mail) ? "console-badge--success" : "console-badge--muted";
  }
  if (section === "cron") {
    return cronSecretConfigured ? "console-badge--success" : "console-badge--muted";
  }
  return "console-badge--success";
}

export function WebsiteSettingsPanel({
  selectedSection,
  general,
  seo,
  storage,
  style,
  pwa,
  auth,
  mail,
  googleCallbackUrl,
  cronBaseUrl,
  cronSecretConfigured,
  cronSecretDisplay,
  cronSecretSource,
}: WebsiteSettingsPanelProps) {
  return (
    <div className="console-provider-layout">
      <aside className="console-provider-card console-provider-card--tabs" aria-label="Bagian pengaturan website">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Website</p>
        </div>
        <ul className="console-provider-tabs__list">
          {websiteSettingSections.map((section) => {
            const active = section.slug === selectedSection;
            return (
              <li key={section.slug}>
                <Link
                  href={`/console/settings/website?section=${section.slug}`}
                  className={`console-provider-tab ${active ? "console-provider-tab--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="console-provider-tab__name">{section.label}</span>
                  <span className="console-provider-tab__slug">{section.description}</span>
                  <span className="console-provider-tab__meta">
                    <span
                      className={`console-badge ${sectionBadgeClass(section.slug, storage, auth, mail, cronSecretConfigured)}`}
                    >
                      {sectionStatus(section.slug, storage, auth, mail, cronSecretConfigured)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="console-provider-stack">
        {selectedSection === "general" ? <WebsiteGeneralForm initialValues={general} /> : null}
        {selectedSection === "seo" ? <WebsiteSeoForm initialValues={seo} /> : null}
        {selectedSection === "style" ? <WebsiteStyleForm initialValues={style} /> : null}
        {selectedSection === "pwa" ? <WebsitePwaForm initialValues={pwa} /> : null}
        {selectedSection === "auth" ? (
          <WebsiteAuthForm initialValues={auth} callbackUrlHint={googleCallbackUrl} />
        ) : null}
        {selectedSection === "mail" ? <WebsiteMailForm initialValues={mail} /> : null}
        {selectedSection === "storage" ? <WebsiteStorageForm initialValues={storage} /> : null}
        {selectedSection === "cron" ? (
          <WebsiteCronPanel
            baseUrl={cronBaseUrl}
            cronSecretConfigured={cronSecretConfigured}
            cronSecretDisplay={cronSecretDisplay}
            secretSource={cronSecretSource}
          />
        ) : null}
      </div>
    </div>
  );
}
