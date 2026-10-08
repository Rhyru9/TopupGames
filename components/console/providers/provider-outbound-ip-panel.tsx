"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getProviderOutboundIp } from "@/app/console/(panel)/settings/providers/actions";
import type { ProviderIpWhitelistGuide } from "@/lib/providers/provider-ip-whitelist";

type ProviderOutboundIpPanelProps = {
  providerSlug: string;
  sandboxMode: boolean;
  guide: ProviderIpWhitelistGuide;
};

function IpCopyField({
  id,
  label,
  value,
  hint,
  pending,
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
  pending?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="console-field console-field--full">
      <label htmlFor={id} className="console-field__label">
        {label}
      </label>
      <div className="console-copy-field">
        <input
          id={id}
          type="text"
          readOnly
          value={pending ? "Mendeteksi…" : value}
          className="console-input console-copy-field__input w-full"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        />
        <button
          type="button"
          className="console-btn-secondary console-copy-field__btn"
          disabled={!value || pending}
          onClick={() => void copy()}
        >
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
      {hint ? <p className="console-field__hint">{hint}</p> : null}
    </div>
  );
}

export function ProviderOutboundIpPanel({
  providerSlug,
  sandboxMode,
  guide,
}: ProviderOutboundIpPanelProps) {
  const [ip, setIp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const result = await getProviderOutboundIp();
      if (result.error) {
        setIp("");
        setError(result.error);
        return;
      }
      setIp(result.ip ?? "");
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="console-provider-card">
      <div className="console-provider-card__head">
        <p className="console-provider-card__title">IP Server (Whitelist)</p>
      </div>
      <div className="console-provider-card__body">
        {sandboxMode && guide.sandboxNote ? (
          <p className="console-field__hint console-provider-ip-panel__sandbox-note">{guide.sandboxNote}</p>
        ) : null}

        <ol className="console-provider-ip-panel__steps">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {guide.dashboardUrl ? (
          <p className="console-provider-ip-panel__dashboard">
            <a
              href={guide.dashboardUrl}
              target="_blank"
              rel="noreferrer"
              className="console-table__link"
            >
              {guide.dashboardLabel ?? "Buka dashboard provider"}
            </a>
          </p>
        ) : null}

        <IpCopyField
          id={`${providerSlug}-outbound-ip`}
          label="IP outbound server ini"
          value={ip}
          hint="IP yang provider lihat saat toko memanggil API mereka. Daftarkan di whitelist provider jika diminta."
          pending={pending}
        />

        {guide.providerSideIps?.map((entry) => (
          <IpCopyField
            key={entry.ip}
            id={`${providerSlug}-provider-ip-${entry.ip}`}
            label={entry.label}
            value={entry.ip}
            hint={entry.hint}
          />
        ))}

        {error ? (
          <div className="console-alert console-alert--error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="console-provider-ip-panel__actions">
          <button
            type="button"
            className="console-btn-ghost"
            onClick={refresh}
            disabled={pending}
          >
            {pending ? "Mengecek…" : "Cek ulang IP"}
          </button>
        </div>
      </div>
    </div>
  );
}
