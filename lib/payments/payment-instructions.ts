export type PaymentInstructionGroup = {
  title: string;
  steps: string[];
};

export function extractPaymentInstructionsFromRaw(raw: unknown): PaymentInstructionGroup[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const url = String((raw as { payment_url?: unknown }).payment_url ?? "").trim();
  if (!url) return [];
  return [
    {
      title: "Cara bayar",
      steps: ["Buka tautan pembayaran DOKU.", "Selesaikan pembayaran sebelum batas waktu."],
    },
  ];
}

export function sanitizePaymentStepHtml(step: string): string {
  return step
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
