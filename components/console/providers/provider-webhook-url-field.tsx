"use client";

type ProviderWebhookUrlFieldProps = {
  url: string;
  label?: string;
  hint?: string;
};

export function ProviderWebhookUrlField({
  url,
  label = "Webhook URL",
  hint = "Daftarkan URL ini di dashboard provider (Webhook Endpoint). Endpoint sudah tersedia di aplikasi — salin persis, jangan ubah path.",
}: ProviderWebhookUrlFieldProps) {
  return (
    <div className="console-field console-field--full">
      <label htmlFor="provider-webhook-url" className="console-field__label">
        {label}
      </label>
      <div className="console-copy-field">
        <input
          id="provider-webhook-url"
          type="text"
          readOnly
          value={url}
          className="console-input console-copy-field__input w-full"
          aria-describedby="provider-webhook-url-hint"
        />
        <button
          type="button"
          className="console-btn-secondary console-copy-field__btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
            } catch {
              /* ignore clipboard errors */
            }
          }}
        >
          Salin
        </button>
      </div>
      <p id="provider-webhook-url-hint" className="console-field__hint">
        {hint}
      </p>
    </div>
  );
}
