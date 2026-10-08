import type { PaymentPricedChannel, PaymentPublicChannel } from "@/lib/payments/payment-channel-types";

/** Metode DOKU Checkout — kode = `payment.payment_method_types`. */
const DOKU_CHANNELS: PaymentPublicChannel[] = [
  { code: "QRIS", name: "QRIS", group: "QRIS", iconUrl: null, type: "qris", minimumAmount: 1, maximumAmount: null },
  { code: "EMONEY_DANA", name: "DANA", group: "E-Wallet", iconUrl: null, type: "ewallet", minimumAmount: 1, maximumAmount: null },
  { code: "EMONEY_OVO", name: "OVO", group: "E-Wallet", iconUrl: null, type: "ewallet", minimumAmount: 1, maximumAmount: null },
  { code: "EMONEY_SHOPEE_PAY", name: "ShopeePay", group: "E-Wallet", iconUrl: null, type: "ewallet", minimumAmount: 1, maximumAmount: null },
  { code: "EMONEY_LINKAJA", name: "LinkAja", group: "E-Wallet", iconUrl: null, type: "ewallet", minimumAmount: 1, maximumAmount: null },
  { code: "VIRTUAL_ACCOUNT_BCA", name: "VA BCA", group: "Virtual Account", iconUrl: null, type: "va", minimumAmount: 10000, maximumAmount: null },
  { code: "VIRTUAL_ACCOUNT_BANK_MANDIRI", name: "VA Mandiri", group: "Virtual Account", iconUrl: null, type: "va", minimumAmount: 10000, maximumAmount: null },
  { code: "VIRTUAL_ACCOUNT_BRI", name: "VA BRI", group: "Virtual Account", iconUrl: null, type: "va", minimumAmount: 10000, maximumAmount: null },
  { code: "VIRTUAL_ACCOUNT_BNI", name: "VA BNI", group: "Virtual Account", iconUrl: null, type: "va", minimumAmount: 10000, maximumAmount: null },
  { code: "VIRTUAL_ACCOUNT_BSI", name: "VA BSI", group: "Virtual Account", iconUrl: null, type: "va", minimumAmount: 10000, maximumAmount: null },
  { code: "VIRTUAL_ACCOUNT_BANK_PERMATA", name: "VA Permata", group: "Virtual Account", iconUrl: null, type: "va", minimumAmount: 10000, maximumAmount: null },
  { code: "VIRTUAL_ACCOUNT_BANK_CIMB", name: "VA CIMB", group: "Virtual Account", iconUrl: null, type: "va", minimumAmount: 10000, maximumAmount: null },
  { code: "VIRTUAL_ACCOUNT_DOKU", name: "VA DOKU", group: "Virtual Account", iconUrl: null, type: "va", minimumAmount: 10000, maximumAmount: null },
  { code: "ONLINE_TO_OFFLINE_ALFA", name: "Alfamart / Alfamidi", group: "Minimarket", iconUrl: null, type: "retail", minimumAmount: 10000, maximumAmount: null },
  { code: "CREDIT_CARD", name: "Kartu kredit / debit", group: "Kartu", iconUrl: null, type: "card", minimumAmount: 1, maximumAmount: null },
  { code: "PEER_TO_PEER_KREDIVO", name: "Kredivo", group: "Paylater", iconUrl: null, type: "paylater", minimumAmount: 10000, maximumAmount: null },
  { code: "PEER_TO_PEER_AKULAKU", name: "Akulaku", group: "Paylater", iconUrl: null, type: "paylater", minimumAmount: 10000, maximumAmount: null },
];

export function listDokuPaymentChannels(): PaymentPublicChannel[] {
  return DOKU_CHANNELS.map((ch) => ({ ...ch }));
}

export function getDokuChannel(code: string): PaymentPublicChannel | null {
  const key = code.trim().toUpperCase();
  return DOKU_CHANNELS.find((ch) => ch.code === key) ?? null;
}

/** DOKU Checkout: amount request = yang dibayar pelanggan. Fee channel di dashboard merchant. */
export function listDokuChannelsWithFees(price: number): PaymentPricedChannel[] {
  const amount = Math.max(0, Math.trunc(price));
  return listDokuPaymentChannels()
    .map((ch) => {
      const belowMin = ch.minimumAmount != null && amount < ch.minimumAmount;
      const aboveMax = ch.maximumAmount != null && amount > ch.maximumAmount;
      return {
        ...ch,
        fee: 0,
        total: amount,
        available: !belowMin && !aboveMax,
      };
    })
    .sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      return a.name.localeCompare(b.name, "id");
    });
}
