import { getAppUrl } from "@/lib/app-url";
import { getProviderWebhookPath } from "@/lib/providers/provider-webhook-meta";

export {
  getProviderWebhookHint,
  getProviderWebhookLabel,
  getProviderWebhookPath,
  providerWebhookPaths,
} from "@/lib/providers/provider-webhook-meta";

/** Server-only: resolve URL penuh (bisa baca siteUrl dari DB). */
export async function getProviderWebhookUrl(slug: string): Promise<string | null> {
  const path = getProviderWebhookPath(slug);
  if (!path) return null;
  return `${await getAppUrl()}${path}`;
}
