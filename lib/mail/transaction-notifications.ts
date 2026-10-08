import { getAppUrl } from "@/lib/app-url";
import { formatMailAmount, sendTemplatedMail } from "@/lib/mail/send-templated-mail";
import { mailTemplateKeys } from "@/lib/mail/template-keys";
import { prisma } from "@/lib/prisma";

async function resolveOrderRecipient(order: {
  email: string | null;
  member: { email: string } | null;
}): Promise<string | null> {
  const direct = order.email?.trim();
  if (direct) return direct;
  return order.member?.email?.trim() || null;
}

export async function notifyOrderCreated(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      productNameSnapshot: true,
      amount: true,
      email: true,
      member: { select: { email: true } },
    },
  });
  if (!order) return;

  const to = await resolveOrderRecipient(order);
  if (!to) return;

  const baseUrl = await getAppUrl();
  await sendTemplatedMail({
    template: mailTemplateKeys.orderCreated,
    entityType: "order",
    entityId: order.id,
    to,
    data: {
      orderCode: order.orderCode,
      productName: order.productNameSnapshot,
      amountLabel: formatMailAmount(order.amount),
      invoiceUrl: `${baseUrl}/invoice/${order.orderCode}`,
    },
  });
}

export async function notifyOrderPaid(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      productNameSnapshot: true,
      amount: true,
      email: true,
      member: { select: { email: true } },
    },
  });
  if (!order) return;

  const to = await resolveOrderRecipient(order);
  if (!to) return;

  const baseUrl = await getAppUrl();
  await sendTemplatedMail({
    template: mailTemplateKeys.orderPaid,
    entityType: "order",
    entityId: order.id,
    to,
    data: {
      orderCode: order.orderCode,
      productName: order.productNameSnapshot,
      amountLabel: formatMailAmount(order.amount),
      invoiceUrl: `${baseUrl}/invoice/${order.orderCode}`,
    },
  });
}

/** Pembayaran gagal / kedaluwarsa (bukan fulfillment). */
export async function notifyOrderFailed(
  orderId: string,
  status: "EXPIRED" | "FAILED",
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      productNameSnapshot: true,
      amount: true,
      email: true,
      member: { select: { email: true } },
    },
  });
  if (!order) return;

  const to = await resolveOrderRecipient(order);
  if (!to) return;

  const baseUrl = await getAppUrl();

  await sendTemplatedMail({
    template: mailTemplateKeys.orderFailed,
    entityType: "order",
    entityId: `${order.id}:payment_${status.toLowerCase()}`,
    to,
    data: {
      orderCode: order.orderCode,
      status,
      productName: order.productNameSnapshot,
      amountLabel: formatMailAmount(order.amount),
      invoiceUrl: `${baseUrl}/invoice/${order.orderCode}`,
    },
  });
}

export async function notifyOrderFulfillmentFailed(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      productNameSnapshot: true,
      amount: true,
      email: true,
      member: { select: { email: true } },
    },
  });
  if (!order) return;

  const to = await resolveOrderRecipient(order);
  if (!to) return;

  const baseUrl = await getAppUrl();
  await sendTemplatedMail({
    template: mailTemplateKeys.orderFulfillmentFailed,
    entityType: "order",
    entityId: `${order.id}:fulfillment_failed`,
    to,
    data: {
      orderCode: order.orderCode,
      productName: order.productNameSnapshot,
      amountLabel: formatMailAmount(order.amount),
      invoiceUrl: `${baseUrl}/invoice/${order.orderCode}`,
    },
  });
}

export async function notifyOrderFulfillmentSuccess(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      productNameSnapshot: true,
      amount: true,
      fulfillmentSn: true,
      email: true,
      member: { select: { email: true } },
    },
  });
  if (!order) return;

  const to = await resolveOrderRecipient(order);
  if (!to) return;

  const baseUrl = await getAppUrl();
  await sendTemplatedMail({
    template: mailTemplateKeys.orderFulfillmentSuccess,
    entityType: "order",
    entityId: `${order.id}:fulfillment_success`,
    to,
    data: {
      orderCode: order.orderCode,
      productName: order.productNameSnapshot,
      amountLabel: formatMailAmount(order.amount),
      serialNumber: order.fulfillmentSn,
      invoiceUrl: `${baseUrl}/invoice/${order.orderCode}`,
    },
  });
}

export async function notifyDepositPaid(depositId: string): Promise<void> {
  const deposit = await prisma.memberDeposit.findUnique({
    where: { id: depositId },
    select: {
      id: true,
      depositCode: true,
      amount: true,
      member: { select: { email: true } },
    },
  });
  if (!deposit?.member.email) return;

  const baseUrl = await getAppUrl();
  await sendTemplatedMail({
    template: mailTemplateKeys.depositPaid,
    entityType: "deposit",
    entityId: deposit.id,
    to: deposit.member.email,
    data: {
      depositCode: deposit.depositCode,
      amountLabel: formatMailAmount(deposit.amount),
      saldoUrl: `${baseUrl}/member/saldo`,
    },
  });
}

export async function notifyDepositFailed(
  depositId: string,
  status: "EXPIRED" | "FAILED",
): Promise<void> {
  const deposit = await prisma.memberDeposit.findUnique({
    where: { id: depositId },
    select: {
      id: true,
      depositCode: true,
      amount: true,
      member: { select: { email: true } },
    },
  });
  if (!deposit?.member.email) return;

  const baseUrl = await getAppUrl();

  await sendTemplatedMail({
    template: mailTemplateKeys.depositFailed,
    entityType: "deposit",
    entityId: `${deposit.id}:${status.toLowerCase()}`,
    to: deposit.member.email,
    data: {
      depositCode: deposit.depositCode,
      status,
      amountLabel: formatMailAmount(deposit.amount),
      saldoUrl: `${baseUrl}/member/saldo`,
    },
  });
}
