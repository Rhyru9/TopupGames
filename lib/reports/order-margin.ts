type OrderMarginInput = {
  memberId: string | null;
  productSku: {
    marginGuest: number;
    marginMember: number;
  };
};

export function resolveOrderSkuMargin(order: OrderMarginInput): number {
  return order.memberId ? order.productSku.marginMember : order.productSku.marginGuest;
}

export function sumOrderSkuMargins(orders: OrderMarginInput[]): number {
  return orders.reduce((sum, order) => sum + resolveOrderSkuMargin(order), 0);
}
