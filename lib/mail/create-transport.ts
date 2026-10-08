import nodemailer from "nodemailer";
import type { SiteMailSettings } from "@/lib/site-settings/site-settings-schemas";

export function createMailTransport(mail: SiteMailSettings) {
  return nodemailer.createTransport({
    host: mail.host.trim(),
    port: mail.port,
    secure: mail.secure,
    auth: {
      user: mail.username.trim(),
      pass: mail.password,
    },
  });
}
