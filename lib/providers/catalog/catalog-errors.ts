export function formatProviderHttpError(
  providerName: string,
  status: number,
  payload: Record<string, unknown>,
  fallback?: string,
): string {
  const message = String(payload.message ?? fallback ?? `${providerName} HTTP ${status}`).trim();
  const lower = message.toLowerCase();

  if (status === 429 || lower.includes("rate limit")) {
    const retryMatch = message.match(/try again in (\d+)\s*seconds?/i);
    const seconds = retryMatch?.[1];
    if (seconds) {
      return `Rate limit ${providerName}. Tunggu ${seconds} detik lalu coba lagi.`;
    }
    return `Rate limit ${providerName}. Tunggu ~1 menit lalu coba lagi.`;
  }

  return message;
}
