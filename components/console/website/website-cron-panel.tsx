"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateWebsiteCronSecret } from "@/app/console/(panel)/settings/website/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { useConsoleActionToast } from "@/components/console/use-console-action-toast";
import { siteSettingsToasts } from "@/lib/site-settings/site-settings-toasts";

type WebsiteCronPanelProps = {
  baseUrl: string;
  cronSecretConfigured: boolean;
  cronSecretDisplay: string;
  secretSource: "database" | "env" | "none";
};

type PlatformId = "vps" | "cpanel" | "cloudpanel" | "cyberpanel" | "aapanel";

const PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: "vps", label: "VPS (SSH)" },
  { id: "cpanel", label: "cPanel" },
  { id: "cloudpanel", label: "CloudPanel" },
  { id: "cyberpanel", label: "CyberPanel" },
  { id: "aapanel", label: "aaPanel" },
];

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.6-6.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyField({
  id,
  label,
  value,
  hint,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
  rows?: number;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
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
        <textarea
          id={id}
          readOnly
          rows={rows}
          value={value}
          className="console-input console-copy-field__input w-full"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.75rem" }}
        />
        <button type="button" className="console-btn-secondary console-copy-field__btn" onClick={() => void copy()}>
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
      {hint ? <p className="console-field__hint">{hint}</p> : null}
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="console-field__hint" style={{ margin: "0 0 1rem", paddingLeft: "1.25rem" }}>
      {items.map((item) => (
        <li key={item} style={{ marginBottom: "0.35rem" }}>
          {item}
        </li>
      ))}
    </ol>
  );
}

export function WebsiteCronPanel({
  baseUrl,
  cronSecretConfigured,
  cronSecretDisplay,
  secretSource,
}: WebsiteCronPanelProps) {
  const router = useRouter();
  const confirm = useConsoleConfirm();
  const { notifySuccess, notifyError } = useConsoleActionToast();
  const [platform, setPlatform] = useState<PlatformId>("vps");
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const endpoint = `${baseUrl}/api/cron/sku-availability`;
  const curlBearer = `curl -fsS -H "Authorization: Bearer ${cronSecretDisplay}" "${endpoint}"`;
  const crontabFull =
    `*/30 * * * * cd /var/www/r9host/app && flock -n /tmp/r9host-sku-cron.lock timeout 25m npx tsx scripts/sync-sku-availability.ts >> /var/log/r9host-sku-cron.log 2>&1`;
  const expireCrontab =
    `*/15 * * * * cd /var/www/r9host/app && flock -n /tmp/r9host-expire-cron.lock timeout 2m npx tsx scripts/expire-unpaid-orders.ts >> /var/log/r9host-expire-cron.log 2>&1`;
  const testCli = `cd /var/www/r9host/app && npx tsx scripts/sync-sku-availability.ts`;
  const testCurl = `curl -i -H "Authorization: Bearer ${cronSecretDisplay}" "${endpoint}"`;
  const secretValue = cronSecretConfigured ? cronSecretDisplay : "—";

  async function copySecret() {
    if (!cronSecretConfigured) return;
    try {
      await navigator.clipboard.writeText(cronSecretDisplay);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  function handleGenerate(rotate: boolean) {
    void (async () => {
      const ok = await confirm({
        title: rotate ? "Generate ulang cron secret?" : "Generate cron secret?",
        description: rotate
          ? "Secret lama tidak berlaku lagi. Update crontab / cPanel / aaPanel dengan perintah baru setelah ini."
          : "Secret akan dibuat sekali dan disimpan di pengaturan website. Salin baris cron ke panel hosting setelah ini.",
        confirmLabel: rotate ? "Generate ulang" : "Generate",
        variant: rotate ? "danger" : "default",
      });
      if (!ok) return;

      startTransition(async () => {
        const result = await generateWebsiteCronSecret({ rotate });
        if (!result.ok) {
          notifyError(result.error);
          return;
        }
        notifySuccess(
          result.rotated
            ? siteSettingsToasts.cronSecretRotated
            : siteSettingsToasts.cronSecretGenerated,
        );
        router.refresh();
      });
    })();
  }

  return (
    <div className="console-provider-form-stack">
      <div className="console-provider-card">
        <div className="console-provider-card__head console-provider-card__head--split">
          <p className="console-provider-card__title">Cron secret</p>
          <span
            className={`console-badge ${cronSecretConfigured ? "console-badge--success" : "console-badge--muted"}`}
          >
            {cronSecretConfigured
              ? secretSource === "env"
                ? "Siap (.env)"
                : "Siap (DB)"
              : "Belum ada"}
          </span>
        </div>
        <div className="console-provider-card__body">
          <p className="console-field__hint" style={{ marginTop: 0 }}>
            Generate sekali. Kalau bocor, klik ikon refresh di samping Salin (ada konfirmasi dulu).
          </p>

          {!cronSecretConfigured ? (
            <div className="console-alert console-alert--error" role="alert">
              Belum ada secret. Klik ikon generate di samping field (atau set <code>CRON_SECRET</code> di{" "}
              <code>.env</code>).
            </div>
          ) : null}

          <div className="console-field console-field--full" style={{ marginTop: "1rem" }}>
            <label htmlFor="cron-secret-value" className="console-field__label">
              Cron secret
            </label>
            <div className="console-copy-field">
              <input
                id="cron-secret-value"
                type="text"
                readOnly
                value={secretValue}
                className="console-input console-copy-field__input w-full"
              />
              <button
                type="button"
                className="console-btn-secondary console-copy-field__btn"
                onClick={() => void copySecret()}
                disabled={!cronSecretConfigured || pending}
              >
                {copied ? "Tersalin" : "Salin"}
              </button>
              <button
                type="button"
                className="console-btn-secondary console-copy-field__btn console-copy-field__icon-btn"
                title={cronSecretConfigured ? "Generate ulang (jika bocor)" : "Generate secret"}
                aria-label={cronSecretConfigured ? "Generate ulang (jika bocor)" : "Generate secret"}
                disabled={pending}
                onClick={() => handleGenerate(cronSecretConfigured)}
              >
                <RefreshIcon />
              </button>
            </div>
            <p className="console-field__hint">
              {secretSource === "env"
                ? "Sedang memakai CRON_SECRET dari .env (override). Generate di console menyimpan ke database."
                : "Disimpan di database pengaturan website."}
            </p>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Pasang di panel hosting</p>
        </div>
        <div className="console-provider-card__body">
          <div
            role="tablist"
            aria-label="Platform cron"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            {PLATFORMS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={platform === item.id}
                className="console-btn-secondary"
                onClick={() => setPlatform(item.id)}
                style={
                  platform === item.id
                    ? {
                        borderColor: "rgba(255, 122, 26, 0.45)",
                        color: "var(--console-accent)",
                      }
                    : undefined
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <CopyField
            id="cron-endpoint"
            label="Endpoint"
            value={endpoint}
            rows={2}
            hint="Path: /api/cron/sku-availability"
          />

          {platform === "vps" ? (
            <>
              <Steps
                items={[
                  "SSH ke VPS: crontab -e",
                  "Tempel baris crontab CLI di bawah (bukan curl HTTP), simpan, keluar",
                  "Tes sekali dengan perintah CLI; curl endpoint hanya untuk debug",
                ]}
              />
              <CopyField
                id="cron-vps-line"
                label="Baris crontab lengkap (CLI)"
                value={crontabFull}
                hint="Jadwal */30. Sync jalan di proses terpisah — tidak membebani Next/PM2 web. Log: /var/log/r9host-sku-cron.log"
              />
              <CopyField
                id="cron-vps-expire"
                label="Cron expire invoice unpaid (CLI)"
                value={expireCrontab}
                hint="Jadwal */15. Refund poin/voucher jika callback kadaluarsa tidak datang. Log: /var/log/r9host-expire-cron.log"
              />
              <CopyField id="cron-vps-test" label="Tes sekali (CLI)" value={testCli} />
              <CopyField
                id="cron-vps-http-test"
                label="Tes HTTP (opsional)"
                value={testCurl}
                hint="Response tanpa daftar items penuh. Jangan jadikan ini crontab produksi."
              />
            </>
          ) : null}

          {platform === "cpanel" ? (
            <>
              <Steps
                items={[
                  "cPanel → Advanced → Cron Jobs",
                  'Common Settings: "Every 15 Minutes" (*/15)',
                  "Paste Command di bawah",
                  "Add New Cron Job",
                ]}
              />
              <CopyField id="cron-cpanel-cmd" label="Command — Bearer (disarankan)" value={curlBearer} />

            </>
          ) : null}

          {platform === "cloudpanel" ? (
            <>
              <Steps
                items={[
                  "CloudPanel → site → Cron Jobs → Add",
                  "Schedule: */15 * * * *",
                  "Command: tempel di bawah",
                  "Save",
                ]}
              />
              <CopyField id="cron-cloudpanel-cmd" label="Command (CloudPanel)" value={curlBearer} />
              <CopyField
                id="cron-cloudpanel-schedule"
                label="Schedule (custom)"
                value="*/15 * * * *"
                rows={1}
              />
            </>
          ) : null}

          {platform === "cyberpanel" ? (
            <>
              <Steps
                items={[
                  "CyberPanel → Cron Jobs → Add",
                  "Minute: */15 · lainnya *",
                  "Command: tempel di bawah",
                ]}
              />
              <CopyField id="cron-cyber-cmd" label="Command (CyberPanel)" value={curlBearer} />
            </>
          ) : null}

          {platform === "aapanel" ? (
            <>
              <Steps
                items={[
                  "aaPanel → Cron → Add",
                  'Type "Shell script"',
                  "Period: tiap 15 menit",
                  "Submit",
                ]}
              />
              <CopyField id="cron-aa-shell" label="Shell script (aaPanel)" value={curlBearer} />
            </>
          ) : null}
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Catatan</p>
        </div>
        <div className="console-provider-card__body">
          <ul className="console-field__hint" style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>
              URL dari <strong>Pengaturan → Umum → URL Website</strong> (atau <code>APP_URL</code>).
            </li>
            <li>
              Setelah generate ulang, wajib update crontab — secret lama langsung tidak valid.
            </li>
            <li>
              Manual: <code>/console/product-skus</code> → <strong>Cek status semua provider</strong>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
