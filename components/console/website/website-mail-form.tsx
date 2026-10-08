"use client";

import { useActionState, useState, useTransition } from "react";
import {
  saveWebsiteMail,
  sendWebsiteMailTest,
  type SiteSettingsFormState,
} from "@/app/console/(panel)/settings/website/actions";
import { useConsoleActionToast } from "@/components/console/use-console-action-toast";
import type { SiteMailSettings } from "@/lib/site-settings/site-settings-schemas";
import { siteSettingsToasts } from "@/lib/site-settings/site-settings-toasts";

type WebsiteMailFormProps = {
  initialValues: SiteMailSettings;
};

const initialState: SiteSettingsFormState = {};

export function WebsiteMailForm({ initialValues }: WebsiteMailFormProps) {
  const [state, formAction, pending] = useActionState(saveWebsiteMail, initialState);
  const { notifySuccess, notifyError } = useConsoleActionToast();
  const [testTo, setTestTo] = useState("");
  const [testPending, startTest] = useTransition();

  function runTest() {
    const to = testTo.trim();
    if (!to) {
      notifyError("Isi alamat email tujuan test.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      notifyError("Alamat email tidak valid.");
      return;
    }

    startTest(() => {
      void sendWebsiteMailTest(to).then((result) => {
        if (result.ok) {
          notifySuccess(`${siteSettingsToasts.mailTestSent} (${to})`);
          return;
        }
        notifyError(result.error);
      });
    });
  }

  return (
    <div className="console-provider-stack">
      <form action={formAction} className="console-form console-provider-form-stack">
        {state.error ? (
          <div className="console-alert console-alert--error" role="alert">
            {state.error}
          </div>
        ) : null}

        <div className="console-provider-card">
          <div className="console-provider-card__head">
            <p className="console-provider-card__title">SMTP</p>
            <p className="console-provider-card__hint">
              Konfigurasi server email untuk verifikasi member dan notifikasi transaksi.
            </p>
          </div>
          <div className="console-provider-card__body">
            <div className="console-form__grid">
              <div className="console-field console-field--full">
                <label className="console-field__label console-field__label--inline">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={initialValues.enabled}
                    className="console-checkbox"
                  />
                  Aktifkan email SMTP
                </label>
              </div>

              <div className="console-field">
                <label htmlFor="mailHost" className="console-field__label">
                  Host
                </label>
                <input
                  id="mailHost"
                  name="host"
                  defaultValue={initialValues.host}
                  className="console-input w-full"
                  placeholder="mail.example.com"
                  autoComplete="off"
                />
                {state.fieldErrors?.host ? (
                  <p className="console-field__error">{state.fieldErrors.host}</p>
                ) : null}
              </div>

              <div className="console-field">
                <label htmlFor="mailPort" className="console-field__label">
                  Port
                </label>
                <input
                  id="mailPort"
                  name="port"
                  type="number"
                  min={1}
                  max={65535}
                  defaultValue={initialValues.port}
                  className="console-input w-full"
                />
              </div>

              <div className="console-field console-field--full">
                <label className="console-field__label console-field__label--inline">
                  <input
                    type="checkbox"
                    name="secure"
                    defaultChecked={initialValues.secure}
                    className="console-checkbox"
                  />
                  SSL/TLS langsung (port 465). Kosongkan untuk STARTTLS (port 587).
                </label>
              </div>

              <div className="console-field">
                <label htmlFor="mailUsername" className="console-field__label">
                  Username
                </label>
                <input
                  id="mailUsername"
                  name="username"
                  defaultValue={initialValues.username}
                  className="console-input w-full"
                  autoComplete="off"
                />
                {state.fieldErrors?.username ? (
                  <p className="console-field__error">{state.fieldErrors.username}</p>
                ) : null}
              </div>

              <div className="console-field">
                <label htmlFor="mailPassword" className="console-field__label">
                  Password
                </label>
                <input
                  id="mailPassword"
                  name="password"
                  type="password"
                  defaultValue={initialValues.password}
                  className="console-input w-full"
                  autoComplete="new-password"
                />
                {state.fieldErrors?.password ? (
                  <p className="console-field__error">{state.fieldErrors.password}</p>
                ) : null}
              </div>

              <div className="console-field">
                <label htmlFor="mailFromEmail" className="console-field__label">
                  From email
                </label>
                <input
                  id="mailFromEmail"
                  name="fromEmail"
                  type="email"
                  defaultValue={initialValues.fromEmail}
                  className="console-input w-full"
                  placeholder="noreply@r9host.com"
                  autoComplete="off"
                />
                {state.fieldErrors?.fromEmail ? (
                  <p className="console-field__error">{state.fieldErrors.fromEmail}</p>
                ) : null}
              </div>

              <div className="console-field">
                <label htmlFor="mailFromName" className="console-field__label">
                  From name
                </label>
                <input
                  id="mailFromName"
                  name="fromName"
                  defaultValue={initialValues.fromName}
                  className="console-input w-full"
                  placeholder="R9host"
                />
              </div>

              <div className="console-field console-field--full">
                <label htmlFor="mailReplyTo" className="console-field__label">
                  Reply-to (opsional)
                </label>
                <input
                  id="mailReplyTo"
                  name="replyTo"
                  type="email"
                  defaultValue={initialValues.replyTo}
                  className="console-input w-full"
                  placeholder="support@r9host.com"
                  autoComplete="off"
                />
                {state.fieldErrors?.replyTo ? (
                  <p className="console-field__error">{state.fieldErrors.replyTo}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="console-provider-card">
          <div className="console-provider-card__head">
            <p className="console-provider-card__title">Tes kirim</p>
            <p className="console-provider-card__hint">
              Simpan pengaturan SMTP dulu, lalu kirim email uji coba.
            </p>
          </div>
          <div className="console-provider-card__body">
            <div className="console-field console-field--full">
              <label htmlFor="mailTestTo" className="console-field__label">
                Email tujuan
              </label>
              <div className="console-copy-field">
                <input
                  id="mailTestTo"
                  type="email"
                  value={testTo}
                  onChange={(event) => setTestTo(event.target.value)}
                  className="console-input console-copy-field__input w-full"
                  placeholder="you@example.com"
                  autoComplete="section-mailtest email"
                />
                <button
                  type="button"
                  className="console-btn-secondary console-copy-field__btn"
                  disabled={testPending || pending}
                  onClick={runTest}
                >
                  {testPending ? "Mengirim…" : "Kirim test"}
                </button>
              </div>
              <p className="console-field__hint">
                Cek inbox dan folder spam. Pesan berisi konfirmasi SMTP siap dipakai.
              </p>
            </div>
          </div>
        </div>

        <div className="console-provider-card">
          <div className="console-provider-card__head">
            <p className="console-provider-card__title">Notifikasi</p>
          </div>
          <div className="console-provider-card__body">
            <div className="console-form__grid">
              {(
                [
                  ["notifyMemberVerify", "Verifikasi email member", initialValues.notifications.memberVerify],
                  ["notifyPasswordReset", "Reset password", initialValues.notifications.passwordReset],
                  ["notifyOrderCreated", "Invoice dibuat", initialValues.notifications.orderCreated],
                  ["notifyOrderPaid", "Pembayaran diterima", initialValues.notifications.orderPaid],
                  [
                    "notifyOrderFailed",
                    "Pembayaran gagal / kadaluarsa",
                    initialValues.notifications.orderFailed,
                  ],
                  [
                    "notifyOrderFulfillmentFailed",
                    "Pesanan gagal diproses",
                    initialValues.notifications.orderFulfillmentFailed,
                  ],
                  [
                    "notifyOrderFulfillmentSuccess",
                    "Pesanan berhasil",
                    initialValues.notifications.orderFulfillmentSuccess,
                  ],
                  ["notifyDepositPaid", "Topup saldo berhasil", initialValues.notifications.depositPaid],
                  [
                    "notifyDepositFailed",
                    "Topup saldo gagal / kadaluarsa",
                    initialValues.notifications.depositFailed,
                  ],
                ] as const
              ).map(([name, label, checked]) => (
                <div key={name} className="console-field console-field--full">
                  <label className="console-field__label console-field__label--inline">
                    <input
                      type="checkbox"
                      name={name}
                      defaultChecked={Boolean(checked)}
                      className="console-checkbox"
                    />
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="console-form__actions">
          <button type="submit" className="console-btn-primary console-form__submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan pengaturan"}
          </button>
        </div>
      </form>
    </div>
  );
}
