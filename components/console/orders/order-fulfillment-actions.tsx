"use client";

import { OrderActionCancelSaldo } from "@/components/console/orders/order-action-cancel-saldo";
import { OrderActionCorrectionFailed } from "@/components/console/orders/order-action-correction-failed";
import { OrderActionLinkMember } from "@/components/console/orders/order-action-link-member";
import { OrderActionManual } from "@/components/console/orders/order-action-manual";
import { OrderActionPoll } from "@/components/console/orders/order-action-poll";
import { OrderActionRetry } from "@/components/console/orders/order-action-retry";
import type { RetryNominalOption } from "@/lib/orders/list-orders";
import type { ReactNode } from "react";

type OrderFulfillmentActionsProps = {
  orderId: string;
  orderCode: string;
  amount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  providerSlug: string | null;
  productSkuId: string;
  checkoutSkuName: string;
  sentSkuName: string | null;
  nominalOptions: RetryNominalOption[];
  hasMember: boolean;
};

export function OrderFulfillmentActions({
  orderId,
  orderCode,
  amount,
  paymentStatus,
  fulfillmentStatus,
  providerSlug,
  productSkuId,
  checkoutSkuName,
  sentSkuName,
  nominalOptions,
  hasMember,
}: OrderFulfillmentActionsProps) {
  const isPaid = paymentStatus === "PAID";
  const isSuccess = fulfillmentStatus === "SUCCESS";
  const isCancelled = fulfillmentStatus === "CANCELLED";
  const isFailed = fulfillmentStatus === "FAILED";
  const isQueuedOrProcessing =
    fulfillmentStatus === "QUEUED" || fulfillmentStatus === "PROCESSING";

  if (!isPaid) {
    return (
      <section className="console-panel console-panel--padded">
        <p className="console-field__hint" style={{ marginTop: 0 }}>
          Aksi fulfillment tersedia setelah pembayaran PAID.
        </p>
      </section>
    );
  }

  if (isCancelled) {
    return (
      <section className="console-panel console-panel--padded">
        <p className="console-field__hint" style={{ marginTop: 0 }}>
          Tidak ada aksi tersisa.
        </p>
      </section>
    );
  }

  const retryProps = {
    orderId,
    productSkuId,
    checkoutSkuName,
    sentSkuName,
    nominalOptions,
  };

  const steps: ReactNode[] = [];

  if (isQueuedOrProcessing) {
    steps.push(<OrderActionPoll key="poll" orderId={orderId} step={1} />);
    steps.push(
      <OrderActionManual key="manual" orderId={orderId} providerSlug={providerSlug} step={2} />,
    );
  } else if (isFailed) {
    let n = 1;
    steps.push(<OrderActionRetry key="retry" {...retryProps} step={n++} />);
    if (!hasMember) {
      steps.push(<OrderActionLinkMember key="link" orderId={orderId} step={n++} />);
    }
    if (hasMember) {
      steps.push(
        <OrderActionCancelSaldo
          key="cancel"
          orderId={orderId}
          orderCode={orderCode}
          amount={amount}
          step={n++}
        />,
      );
    }
    steps.push(
      <OrderActionManual key="manual" orderId={orderId} providerSlug={providerSlug} step={n++} />,
    );
  } else if (isSuccess) {
    steps.push(<OrderActionPoll key="poll" orderId={orderId} step={1} />);
    steps.push(<OrderActionCorrectionFailed key="correction" orderId={orderId} step={2} />);
  }

  if (steps.length === 0) {
    return (
      <section className="console-panel console-panel--padded">
        <p className="console-field__hint" style={{ marginTop: 0 }}>
          Tidak ada aksi untuk status ini.
        </p>
      </section>
    );
  }

  return <div className="console-order-actions__steps">{steps}</div>;
}
