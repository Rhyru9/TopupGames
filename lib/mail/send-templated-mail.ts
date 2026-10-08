import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/app-url";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { formatRupiah } from "@/lib/format-rupiah";
import { sendMail } from "@/lib/mail/send-mail";
import {
  mailTemplateKeys,
  type MailEntityType,
  type MailTemplateKey,
} from "@/lib/mail/template-keys";
import {
  renderDepositFailedTemplate,
  renderDepositPaidTemplate,
  renderMailTestTemplate,
  renderOrderCreatedTemplate,
  renderOrderFailedTemplate,
  renderOrderFulfillmentFailedTemplate,
  renderOrderFulfillmentSuccessTemplate,
  renderOrderPaidTemplate,
  renderPasswordResetTemplate,
  renderVerifyEmailTemplate,
} from "@/lib/mail/templates/index";
import type { SiteMailNotificationSettings } from "@/lib/site-settings/site-settings-schemas";

export type TemplatedMailInput = {
  template: MailTemplateKey;
  entityType: MailEntityType;
  entityId: string;
  to: string;
  data: Record<string, string | number | null | undefined>;
  skipToggle?: boolean;
  skipDedup?: boolean;
};

function notificationEnabled(
  notifications: SiteMailNotificationSettings,
  template: MailTemplateKey,
): boolean {
  switch (template) {
    case mailTemplateKeys.memberVerify:
      return notifications.memberVerify;
    case mailTemplateKeys.passwordReset:
      return notifications.passwordReset;
    case mailTemplateKeys.orderCreated:
      return notifications.orderCreated;
    case mailTemplateKeys.orderPaid:
      return notifications.orderPaid;
    case mailTemplateKeys.orderFailed:
      return notifications.orderFailed;
    case mailTemplateKeys.orderFulfillmentFailed:
      return notifications.orderFulfillmentFailed;
    case mailTemplateKeys.orderFulfillmentSuccess:
      return notifications.orderFulfillmentSuccess;
    case mailTemplateKeys.depositPaid:
      return notifications.depositPaid;
    case mailTemplateKeys.depositFailed:
      return notifications.depositFailed;
    case mailTemplateKeys.mailTest:
      return true;
    default:
      return false;
  }
}

function renderTemplate(
  template: MailTemplateKey,
  siteName: string,
  baseUrl: string,
  data: Record<string, string | number | null | undefined>,
) {
  switch (template) {
    case mailTemplateKeys.memberVerify:
      return renderVerifyEmailTemplate({
        siteName,
        memberName: String(data.memberName ?? "Member"),
        verifyUrl: String(data.verifyUrl ?? `${baseUrl}/member`),
      });
    case mailTemplateKeys.passwordReset:
      return renderPasswordResetTemplate({
        siteName,
        memberName: String(data.memberName ?? "Member"),
        resetUrl: String(data.resetUrl ?? `${baseUrl}/masuk`),
      });
    case mailTemplateKeys.orderCreated:
      return renderOrderCreatedTemplate({
        siteName,
        orderCode: String(data.orderCode ?? ""),
        productName: String(data.productName ?? ""),
        amountLabel: String(data.amountLabel ?? ""),
        invoiceUrl: String(data.invoiceUrl ?? `${baseUrl}/invoice`),
      });
    case mailTemplateKeys.orderPaid:
      return renderOrderPaidTemplate({
        siteName,
        orderCode: String(data.orderCode ?? ""),
        productName: String(data.productName ?? ""),
        amountLabel: String(data.amountLabel ?? ""),
        invoiceUrl: String(data.invoiceUrl ?? `${baseUrl}/invoice`),
      });
    case mailTemplateKeys.orderFailed: {
      const status = String(data.status ?? "FAILED").toUpperCase() === "EXPIRED" ? "EXPIRED" : "FAILED";
      return renderOrderFailedTemplate({
        siteName,
        orderCode: String(data.orderCode ?? ""),
        status,
        productName: data.productName ? String(data.productName) : undefined,
        amountLabel: data.amountLabel ? String(data.amountLabel) : undefined,
        invoiceUrl: String(data.invoiceUrl ?? `${baseUrl}/invoice/${String(data.orderCode ?? "")}`),
      });
    }
    case mailTemplateKeys.orderFulfillmentFailed:
      return renderOrderFulfillmentFailedTemplate({
        siteName,
        orderCode: String(data.orderCode ?? ""),
        productName: String(data.productName ?? ""),
        amountLabel: String(data.amountLabel ?? ""),
        invoiceUrl: String(data.invoiceUrl ?? `${baseUrl}/invoice`),
      });
    case mailTemplateKeys.orderFulfillmentSuccess:
      return renderOrderFulfillmentSuccessTemplate({
        siteName,
        orderCode: String(data.orderCode ?? ""),
        productName: String(data.productName ?? ""),
        amountLabel: String(data.amountLabel ?? ""),
        serialNumber: data.serialNumber ? String(data.serialNumber) : null,
        invoiceUrl: String(data.invoiceUrl ?? `${baseUrl}/invoice`),
      });
    case mailTemplateKeys.depositPaid:
      return renderDepositPaidTemplate({
        siteName,
        depositCode: String(data.depositCode ?? ""),
        amountLabel: String(data.amountLabel ?? ""),
        saldoUrl: String(data.saldoUrl ?? `${baseUrl}/member/saldo`),
      });
    case mailTemplateKeys.depositFailed: {
      const status = String(data.status ?? "FAILED").toUpperCase() === "EXPIRED" ? "EXPIRED" : "FAILED";
      return renderDepositFailedTemplate({
        siteName,
        depositCode: String(data.depositCode ?? ""),
        status,
        amountLabel: data.amountLabel ? String(data.amountLabel) : undefined,
        saldoUrl: String(data.saldoUrl ?? `${baseUrl}/member/saldo`),
      });
    }
    case mailTemplateKeys.mailTest:
      return renderMailTestTemplate({ siteName });
    default:
      return null;
  }
}

export async function sendTemplatedMail(
  input: TemplatedMailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = input.to.trim();
  if (!to) return { ok: false, error: "Email penerima kosong." };

  const settings = await getSiteSettings();
  if (!settings.mail.enabled) {
    return { ok: false, error: "Email nonaktif." };
  }

  if (!input.skipToggle && !notificationEnabled(settings.mail.notifications, input.template)) {
    return { ok: false, error: "Notifikasi email jenis ini nonaktif." };
  }

  if (!input.skipDedup) {
    const existing = await prisma.emailLog.findUnique({
      where: {
        templateKey_entityType_entityId: {
          templateKey: input.template,
          entityType: input.entityType,
          entityId: input.entityId,
        },
      },
    });
    if (existing) return { ok: false, error: "Email sudah pernah dikirim." };
  }

  const baseUrl = await getAppUrl();
  const siteName = settings.general.siteName.trim() || "R9host";
  const rendered = renderTemplate(input.template, siteName, baseUrl, input.data);
  if (!rendered) return { ok: false, error: "Template tidak dikenal." };

  const sent = await sendMail({ to, subject: rendered.subject, html: rendered.html });
  if (!sent.ok) return sent;

  if (!input.skipDedup) {
    try {
      await prisma.emailLog.create({
        data: {
          templateKey: input.template,
          entityType: input.entityType,
          entityId: input.entityId,
          recipient: to,
        },
      });
    } catch {
      // race on callback retry — treat as sent
    }
  }

  return { ok: true };
}

export function formatMailAmount(value: number): string {
  return formatRupiah(Math.max(0, Math.trunc(value)));
}
