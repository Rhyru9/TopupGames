import Link from "next/link";
import { PaymentGatewayConfigForm } from "@/components/console/payment-gateways/payment-gateway-config-form";
import { PaymentGatewayStatusToggle } from "@/components/console/payment-gateways/payment-gateway-status-toggle";
import { getPaymentGatewayCallbackUrl } from "@/lib/payments/get-payment-gateway-config";
import {
  getPaymentGatewayConfigSchema,
  isPaymentGatewayConfigured,
  maskPaymentGatewayConfig,
  resolvePaymentGatewayApiBase,
} from "@/lib/payments/payment-gateway-schemas";

export type PaymentGatewaySettingsItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  docsUrl: string | null;
  sandboxMode: boolean;
  isActive: boolean;
  config: unknown;
};

type PaymentGatewaySettingsPanelProps = {
  gateways: PaymentGatewaySettingsItem[];
  selectedSlug: string;
};

function asConfigRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function PaymentGatewaySettingsPanel({
  gateways,
  selectedSlug,
}: PaymentGatewaySettingsPanelProps) {
  const selected =
    gateways.find((gateway) => gateway.slug === selectedSlug) ?? gateways[0] ?? null;

  if (!selected) {
    return (
      <div className="console-provider-card">
        <div className="console-provider-card__body">
          <div className="console-empty">
            <p className="console-empty__title">Belum ada payment gateway</p>
            <p className="console-empty__text">
              Jalankan migrasi database untuk mengisi daftar payment gateway.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const schema = getPaymentGatewayConfigSchema(selected.slug);
  const rawConfig = asConfigRecord(selected.config);
  const configured = isPaymentGatewayConfigured(selected.slug, rawConfig);
  const initialConfig = schema ? maskPaymentGatewayConfig(rawConfig, schema) : {};
  const apiBase = resolvePaymentGatewayApiBase(selected.slug, selected.sandboxMode);
  const webhookUrl = await getPaymentGatewayCallbackUrl(selected.slug);

  return (
    <div className="console-provider-layout">
      <aside className="console-provider-card console-provider-card--tabs" aria-label="Daftar payment gateway">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Gateway</p>
        </div>
        <ul className="console-provider-tabs__list">
          {gateways.map((gateway) => {
            const active = gateway.slug === selected.slug;
            const itemConfigured = isPaymentGatewayConfigured(
              gateway.slug,
              asConfigRecord(gateway.config),
            );

            return (
              <li key={gateway.id}>
                <Link
                  href={`/console/settings/payment?gateway=${gateway.slug}`}
                  className={`console-provider-tab ${active ? "console-provider-tab--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="console-provider-tab__name">{gateway.name}</span>
                  <span className="console-provider-tab__slug">{gateway.slug}</span>
                  <span className="console-provider-tab__meta">
                    <span
                      className={`console-badge ${
                        gateway.isActive ? "console-badge--success" : "console-badge--muted"
                      }`}
                    >
                      {gateway.isActive ? "Aktif" : "Nonaktif"}
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
            <p className="console-provider-card__title">Informasi Gateway</p>
            <PaymentGatewayStatusToggle gatewayId={selected.id} isActive={selected.isActive} />
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
                <span className="console-provider-stat__label">Mode</span>
                <strong>{selected.sandboxMode ? "Sandbox" : "Production"}</strong>
              </div>
              <div className="console-provider-stat">
                <span className="console-provider-stat__label">API Base</span>
                <strong className="console-table__muted" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
                  {apiBase || "—"}
                </strong>
              </div>
              <div className="console-provider-stat">
                <span className="console-provider-stat__label">Kredensial</span>
                <strong>{configured ? "Sudah diisi" : "Belum diisi"}</strong>
              </div>
            </div>
          </div>
        </div>

        {schema ? (
          <PaymentGatewayConfigForm
            key={selected.id}
            gatewayId={selected.id}
            gatewaySlug={selected.slug}
            schema={schema}
            sandboxMode={selected.sandboxMode}
            initialConfig={initialConfig}
            rawConfig={rawConfig}
            webhookUrl={webhookUrl}
          />
        ) : null}
      </div>
    </div>
  );
}
