/** Path & copy UI — aman di Client Component (tanpa DB / fs). */

export const providerWebhookPaths: Record<string, string> = {
  melostore: "/api/providers/melostore/webhook",
  digiflazz: "/api/providers/digiflazz/webhook",
  iak: "/api/providers/iak/callback",
};

export function getProviderWebhookPath(slug: string): string | null {
  return providerWebhookPaths[slug] ?? null;
}

/** Label UI — IAK memakai istilah Callback, bukan Webhook. */
export function getProviderWebhookLabel(slug: string): string {
  if (slug === "iak") return "Callback URL";
  return "Webhook URL";
}

export function getProviderWebhookHint(slug: string): string {
  if (slug === "iak") {
    return "Salin URL ini ke menu Callback di portal IAK (developer.iak.id). Sandbox & production bisa beda URL di portal — pastikan cocok dengan mode di sini. Endpoint sudah tersedia di aplikasi.";
  }
  return "Daftarkan URL ini di dashboard provider (Webhook Endpoint). Endpoint sudah tersedia di aplikasi — salin persis, jangan ubah path.";
}
