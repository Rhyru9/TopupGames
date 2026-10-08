import Link from "next/link";
import { ProviderBalanceCard } from "@/components/console/providers/provider-balance-card";
import { ProviderConfigForm } from "@/components/console/providers/provider-config-form";
import { ProviderStatusToggle } from "@/components/console/providers/provider-status-toggle";
import { getProviderWebhookUrl } from "@/lib/providers/provider-webhook-urls";
import {
  maybeSyncProviderBalance,
  supportsProviderBalanceSync,
  type ProviderBalanceSnapshot,
} from "@/lib/providers/provider-balance-sync";
import { formatProviderBalanceDisplay } from "@/lib/providers/provider-balance-format";
import {
  getProviderConfigSchema,
  isProviderConfigured,
  maskProviderConfig,
} from "@/lib/providers/provider-schemas";

export type ProviderSettingsItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  docsUrl: string | null;
  sandboxMode: boolean;
  isActive: boolean;
  supportsCatalogSync: boolean;
  config: unknown;
  skuCount: number;
  balance: ProviderBalanceSnapshot;
};

type ProviderSettingsPanelProps = {
  providers: ProviderSettingsItem[];
  selectedSlug: string;
};

function asConfigRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function ProviderSettingsPanel({ providers, selectedSlug }: ProviderSettingsPanelProps) {
  const selected =
    providers.find((provider) => provider.slug === selectedSlug) ?? providers[0] ?? null;

  if (!selected) {
    return (
      <div className="console-provider-card">
        <div className="console-provider-card__body">
          <div className="console-empty">
            <p className="console-empty__title">Belum ada provider</p>
            <p className="console-empty__text">Jalankan migrasi database untuk mengisi daftar provider.</p>
          </div>
        </div>
      </div>
    );
  }

  const schema = getProviderConfigSchema(selected.slug);
  const rawConfig = asConfigRecord(selected.config);
  const configured = isProviderConfigured(selected.slug, rawConfig);
  const initialConfig = schema ? maskProviderConfig(rawConfig, schema) : {};

  let balance = selected.balance;
  if (supportsProviderBalanceSync(selected.slug) && configured) {
    const synced = await maybeSyncProviderBalance(selected.id);
    if (synced) balance = synced;
  }

  const balanceDisplay = formatProviderBalanceDisplay(balance);
  const showBalanceCard = supportsProviderBalanceSync(selected.slug);

  return (
    <div className="console-provider-layout">
      <aside className="console-provider-card console-provider-card--tabs" aria-label="Daftar provider">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Provider</p>
        </div>
        <ul className="console-provider-tabs__list">
          {providers.map((provider) => {
            const active = provider.slug === selected.slug;
            const itemConfigured = isProviderConfigured(provider.slug, asConfigRecord(provider.config));

            return (
              <li key={provider.id}>
                <Link
                  href={`/console/settings/providers?provider=${provider.slug}`}
                  className={`console-provider-tab ${active ? "console-provider-tab--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="console-provider-tab__name">{provider.name}</span>
                  <span className="console-provider-tab__slug">{provider.slug}</span>
                  <span className="console-provider-tab__meta">
                    <span
                      className={`console-badge ${
                        provider.isActive ? "console-badge--success" : "console-badge--muted"
                      }`}
                    >
                      {provider.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    <span
                      className={`console-badge ${
                        itemConfigured ? "console-badge--success" : "console-badge--muted"
                      }`}
                    >
                      {itemConfigured ? "Siap" : "Belum diisi"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="console-provider-stack">
        <div className="console-provider-card">
          <div className="console-provider-card__head console-provider-card__head--split">
            <p className="console-provider-card__title">Informasi Provider</p>
            <ProviderStatusToggle
              providerId={selected.id}
              isActive={selected.isActive}
              skuCount={selected.skuCount}
            />
          </div>
          <div className="console-provider-card__body">
            <h2 className="console-provider-panel__title">{selected.name}</h2>
            <p className="console-provider-panel__slug">
              Kode: <code>{selected.slug}</code>
            </p>
            {selected.description ? (
              <p className="console-provider-panel__desc">{selected.description}</p>
            ) : null}
            {selected.docsUrl ? (
              <a
                href={selected.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="console-table__link console-provider-panel__docs"
              >
                Dokumentasi API
              </a>
            ) : null}

            <div className="console-provider-panel__stats">
              <div className="console-provider-stat">
                <span className="console-provider-stat__label">SKU Produk</span>
                <strong>{selected.skuCount}</strong>
              </div>
              <div className="console-provider-stat">
                <span className="console-provider-stat__label">Mode</span>
                <strong>
                  {selected.slug === "manual" ? "—" : selected.sandboxMode ? "Sandbox" : "Production"}
                </strong>
              </div>
              <div className="console-provider-stat">
                <span className="console-provider-stat__label">Import SKU</span>
                <strong>
                  {selected.slug === "manual"
                    ? "Manual"
                    : selected.supportsCatalogSync
                      ? "Sync batch"
                      : "Manual saja"}
                </strong>
              </div>
              <div className="console-provider-stat">
                <span className="console-provider-stat__label">Kredensial</span>
                <strong>{configured ? "Sudah diisi" : "Belum diisi"}</strong>
              </div>
              {showBalanceCard ? (
                <div className="console-provider-stat console-provider-stat--balance">
                  <span className="console-provider-stat__label">Saldo</span>
                  <strong>{balanceDisplay.primary}</strong>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {showBalanceCard ? (
          <ProviderBalanceCard
            providerId={selected.id}
            providerSlug={selected.slug}
            initialBalance={balance}
          />
        ) : null}

        {schema ? (
          <ProviderConfigForm
            key={selected.id}
            providerId={selected.id}
            providerSlug={selected.slug}
            schema={schema}
            sandboxMode={selected.sandboxMode}
            initialConfig={initialConfig}
            rawConfig={rawConfig}
            webhookUrl={await getProviderWebhookUrl(selected.slug)}
          />
        ) : null}
      </div>
    </div>
  );
}
