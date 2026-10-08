export type PaymentPublicChannel = {
  code: string;
  name: string;
  group: string;
  iconUrl: string | null;
  type: string;
  minimumAmount: number | null;
  maximumAmount: number | null;
};

export type PaymentPricedChannel = PaymentPublicChannel & {
  fee: number;
  total: number;
  available: boolean;
};
