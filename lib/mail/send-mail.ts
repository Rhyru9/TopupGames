import { createMailTransport } from "@/lib/mail/create-transport";
import { getMailSettings } from "@/lib/mail/get-mail-config";
import { isMailConfigured } from "@/lib/site-settings/site-settings-schemas";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendMailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const mail = await getMailSettings();
  if (!isMailConfigured(mail)) {
    return { ok: false, error: "SMTP belum dikonfigurasi atau nonaktif." };
  }

  const to = input.to.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "Alamat email penerima tidak valid." };
  }

  try {
    const transport = createMailTransport(mail);
    const fromName = mail.fromName.trim() || "R9host";
    const fromEmail = mail.fromEmail.trim();
    const info = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      replyTo: mail.replyTo.trim() || undefined,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return { ok: true, messageId: String(info.messageId ?? "") };
  } catch (error) {
    console.error("[mail] send failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal mengirim email.",
    };
  }
}
