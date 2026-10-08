import { OrderFulfillmentStatus, OrderPaymentStatus } from "@/app/generated/prisma/client";
import {
  completePaidMemberDeposit,
  syncMemberDepositPaymentStatus,
} from "@/lib/member/member-deposits";
import { creditOrderCashbackInTx } from "@/lib/orders/credit-order-cashback";
import { closeUnpaidOrderInTx } from "@/lib/orders/close-unpaid-order";
import {
  notifyDepositFailed,
  notifyDepositPaid,
  notifyOrderFailed,
  notifyOrderPaid,
} from "@/lib/mail/transaction-notifications";
import { enqueueProcessTopup } from "@/lib/orders/enqueue-fulfillment";
import { prisma } from "@/lib/prisma";
import { resolveDokuExpectedPaidAmount } from "@/lib/payments/doku-amount";
import {
  getDokuClientId,
  getDokuSecretKey,
  verifyDokuNotificationSignature,
} from "@/lib/payments/doku";
import { confirmVoucherRedemptionInTx } from "@/lib/promo/voucher-redemption";

export const runtime = "nodejs";

function header(request: Request, name: string): string | null {
  return request.headers.get(name) ?? request.headers.get(name.toLowerCase());
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secretKey = await getDokuSecretKey();
  const expectedClientId = await getDokuClientId();
  if (!secretKey || !expectedClientId) {
    return Response.json({ success: false }, { status: 503 });
  }

  const clientId = header(request, "Client-Id");
  if (clientId?.trim() !== expectedClientId) {
    return Response.json({ success: false }, { status: 401 });
  }

  const ok = verifyDokuNotificationSignature({
    rawBody,
    clientId,
    requestId: header(request, "Request-Id"),
    timestamp: header(request, "Request-Timestamp"),
    signature: header(request, "Signature"),
    requestTarget: "/api/doku/notification",
    secretKey,
  });
  if (!ok) {
    return Response.json({ success: false }, { status: 401 });
  }

  let payload: {
    order?: { invoice_number?: string; amount?: number | string };
    transaction?: { status?: string };
    channel?: { id?: string };
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }

  const invoiceNumber = String(payload.order?.invoice_number ?? "").trim();
  if (!invoiceNumber) {
    return Response.json({ success: false }, { status: 400 });
  }

  let payment = await prisma.payment.findUnique({
    where: { reference: invoiceNumber },
    include: {
      order: { select: { id: true, amount: true, paymentStatus: true } },
      memberDeposit: {
        select: {
          id: true,
          amount: true,
          depositCode: true,
          memberId: true,
          paymentStatus: true,
        },
      },
    },
  });

  if (!payment) {
    const order = await prisma.order.findUnique({
      where: { orderCode: invoiceNumber },
      select: { id: true, amount: true },
    });
    const deposit = !order
      ? await prisma.memberDeposit.findUnique({
          where: { depositCode: invoiceNumber },
          select: { id: true, amount: true },
        })
      : null;

    if (order || deposit) {
      const totalAmountHint = Math.trunc(Number(payload.order?.amount));
      await prisma.payment
        .create({
          data: {
            orderId: order?.id ?? null,
            memberDepositId: deposit?.id ?? null,
            provider: "doku",
            channel: String(payload.channel?.id ?? "DOKU").trim().toUpperCase().slice(0, 40) || "DOKU",
            reference: invoiceNumber,
            amount:
              Number.isFinite(totalAmountHint) && totalAmountHint > 0
                ? totalAmountHint
                : (order?.amount ?? deposit?.amount ?? 0),
            status: OrderPaymentStatus.UNPAID,
          },
        })
        .catch(() => null);

      payment = await prisma.payment.findUnique({
        where: { reference: invoiceNumber },
        include: {
          order: { select: { id: true, amount: true, paymentStatus: true } },
          memberDeposit: {
            select: {
              id: true,
              amount: true,
              depositCode: true,
              memberId: true,
              paymentStatus: true,
            },
          },
        },
      });
    }
  }

  if (!payment) {
    return Response.json({ success: false }, { status: 404 });
  }

  const statusRaw = String(payload.transaction?.status ?? "").toUpperCase();
  const callbackJson = payload as object;
  const isDeposit = Boolean(payment.memberDepositId && payment.memberDeposit);
  const isOrder = Boolean(payment.orderId && payment.order);

  if (statusRaw === "SUCCESS" || statusRaw === "PAID") {
    const totalAmount = Math.trunc(Number(payload.order?.amount));
    const expectedAmount = resolveDokuExpectedPaidAmount(payment);
    if (!Number.isFinite(totalAmount) || totalAmount !== expectedAmount) {
      console.error("[doku-notification] amount mismatch", {
        invoiceNumber,
        callbackTotal: totalAmount,
        expectedAmount,
        storedPaymentAmount: payment.amount,
      });
      return Response.json({ success: false }, { status: 400 });
    }

    if (isDeposit && payment.memberDeposit) {
      try {
        const result = await completePaidMemberDeposit({
          paymentId: payment.id,
          depositId: payment.memberDeposit.id,
          memberId: payment.memberDeposit.memberId,
          creditAmount: payment.memberDeposit.amount,
          depositCode: payment.memberDeposit.depositCode,
          callbackJson,
        });
        if (result.credited) {
          void notifyDepositPaid(payment.memberDeposit.id).catch((err) =>
            console.error("[mail] deposit paid notify failed", invoiceNumber, err),
          );
        }
      } catch (error) {
        console.error("[doku-notification] deposit credit failed", invoiceNumber, error);
        return Response.json({ success: false }, { status: 500 });
      }
      return Response.json({ success: true });
    }

    if (isOrder && payment.orderId) {
      try {
        let orderPaidNow = false;
        await prisma.$transaction(async (tx) => {
          const updated = await tx.payment.updateMany({
            where: { id: payment.id, status: OrderPaymentStatus.UNPAID },
            data: {
              status: OrderPaymentStatus.PAID,
              paidAt: new Date(),
              rawCallback: callbackJson,
            },
          });

          orderPaidNow = updated.count > 0;

          if (updated.count === 0) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { rawCallback: callbackJson },
            });
          }

          await tx.order.updateMany({
            where: {
              id: payment.orderId!,
              paymentStatus: OrderPaymentStatus.UNPAID,
            },
            data: {
              paymentStatus: OrderPaymentStatus.PAID,
              fulfillmentStatus: OrderFulfillmentStatus.QUEUED,
            },
          });

          await creditOrderCashbackInTx(tx, payment.orderId!);
          await confirmVoucherRedemptionInTx(tx, payment.orderId!);
        });

        if (orderPaidNow) {
          void notifyOrderPaid(payment.orderId).catch((err) =>
            console.error("[mail] order paid notify failed", invoiceNumber, err),
          );
          void enqueueProcessTopup(payment.orderId, "paid").catch((err) =>
            console.error("[fulfillment] enqueue failed", invoiceNumber, err),
          );
        }
      } catch (error) {
        console.error("[doku-notification] order cashback failed", invoiceNumber, error);
        return Response.json({ success: false }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    console.error("[doku-notification] SUCCESS without order or deposit", invoiceNumber);
    return Response.json({ success: false }, { status: 400 });
  }

  if (statusRaw === "EXPIRED" || statusRaw === "FAILED") {
    const nextStatus =
      statusRaw === "EXPIRED" ? OrderPaymentStatus.EXPIRED : OrderPaymentStatus.FAILED;

    if (isDeposit && payment.memberDepositId) {
      await syncMemberDepositPaymentStatus({
        paymentId: payment.id,
        depositId: payment.memberDepositId,
        nextStatus,
        callbackJson,
      });
      void notifyDepositFailed(
        payment.memberDepositId,
        statusRaw as "EXPIRED" | "FAILED",
      ).catch((err) => console.error("[mail] deposit failed notify", invoiceNumber, err));
      return Response.json({ success: true });
    }

    if (isOrder && payment.orderId) {
      let orderFailedNow = false;
      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: OrderPaymentStatus.UNPAID,
          },
          data: { rawCallback: callbackJson },
        });
        const closed = await closeUnpaidOrderInTx(tx, payment.orderId!, nextStatus);
        orderFailedNow = closed.closed;
      });

      if (orderFailedNow) {
        void notifyOrderFailed(
          payment.orderId,
          statusRaw as "EXPIRED" | "FAILED",
        ).catch((err) => console.error("[mail] order failed notify", invoiceNumber, err));
      }

      return Response.json({ success: true });
    }
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { rawCallback: callbackJson },
  });

  return Response.json({ success: true });
}
