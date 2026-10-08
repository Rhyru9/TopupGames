export type MailLayoutTone = "default" | "success" | "danger" | "warning";

export type MailDetailRow = {
  label: string;
  value: string;
};

export type MailLayoutOptions = {
  siteName: string;
  preview?: string;
  title: string;
  bodyHtml: string;
  statusLabel?: string;
  tone?: MailLayoutTone;
  details?: MailDetailRow[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toneAccent(tone: MailLayoutTone): string {
  if (tone === "danger") return "#ff4d4d";
  if (tone === "warning") return "#ffb020";
  if (tone === "success") return "#ff7a1a";
  return "#ff7a1a";
}

function toneBadgeBg(tone: MailLayoutTone): string {
  if (tone === "danger") return "rgba(255,77,77,0.14)";
  if (tone === "warning") return "rgba(255,176,32,0.14)";
  if (tone === "success") return "rgba(255,122,26,0.14)";
  return "rgba(255,122,26,0.12)";
}

export function renderMailLayout(options: MailLayoutOptions): string {
  const siteName = escapeHtml(options.siteName || "R9host");
  const title = escapeHtml(options.title);
  const preview = options.preview ? escapeHtml(options.preview) : title;
  const footer = escapeHtml(
    options.footerNote ||
      "Pesan ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.",
  );
  const tone = options.tone ?? "default";
  const accent = toneAccent(tone);
  const ctaBg = tone === "danger" ? "#ff4d4d" : "#ff7a1a";
  const ctaColor = tone === "danger" ? "#ffffff" : "#050505";

  const statusBadge = options.statusLabel
    ? `<span style="display:inline-block;margin-top:10px;padding:4px 10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${accent};background:${toneBadgeBg(tone)};border:1px solid ${accent};">${escapeHtml(options.statusLabel)}</span>`
    : "";

  const details =
    options.details && options.details.length > 0
      ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 0;border-collapse:collapse;border:1px solid #2a2a2a;">
          ${options.details
            .map(
              (row, index) => `<tr>
              <td style="padding:10px 12px;width:36%;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#8a8a8a;border-top:${index === 0 ? "0" : "1px solid #2a2a2a"};background:#101010;">${escapeHtml(row.label)}</td>
              <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#f0f0f0;border-top:${index === 0 ? "0" : "1px solid #2a2a2a"};word-break:break-word;">${escapeHtml(row.value)}</td>
            </tr>`,
            )
            .join("")}
        </table>`
      : "";

  const cta =
    options.ctaLabel && options.ctaUrl
      ? `<p style="margin:24px 0 0;">
          <a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;padding:12px 20px;background:${ctaBg};color:${ctaColor};font-weight:700;text-decoration:none;border-radius:4px;">
            ${escapeHtml(options.ctaLabel)}
          </a>
        </p>`
      : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#e8e8e8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#121212;border:1px solid #2a2a2a;border-radius:8px;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #2a2a2a;border-top:3px solid ${accent};">
              <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${accent};font-weight:700;">${siteName}</p>
              <h1 style="margin:8px 0 0;font-size:20px;line-height:1.3;color:#f4f4f4;">${title}</h1>
              ${statusBadge}
            </td>
          </tr>
          <tr>
            <td style="padding:24px;font-size:15px;line-height:1.6;color:#d8d8d8;">
              ${options.bodyHtml}
              ${details}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 20px;border-top:1px solid #2a2a2a;font-size:12px;line-height:1.5;color:#8a8a8a;">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
