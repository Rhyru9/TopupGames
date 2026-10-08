export const mailTemplateKeys = {
  memberVerify: "member_verify",
  passwordReset: "password_reset",
  orderCreated: "order_created",
  orderPaid: "order_paid",
  orderFailed: "order_failed",
  orderFulfillmentFailed: "order_fulfillment_failed",
  orderFulfillmentSuccess: "order_fulfillment_success",
  depositPaid: "deposit_paid",
  depositFailed: "deposit_failed",
  mailTest: "mail_test",
} as const;

export type MailTemplateKey = (typeof mailTemplateKeys)[keyof typeof mailTemplateKeys];

export type MailEntityType = "member" | "order" | "deposit" | "system";
