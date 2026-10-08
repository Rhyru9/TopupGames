"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  getSaldoTopupPaymentOptions,
  submitSaldoTopup,
} from "@/app/member/saldo/actions";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { formatRupiah } from "@/lib/format-rupiah";
import {
  SALDO_TOPUP_MAX,
  SALDO_TOPUP_MIN,
  SALDO_TOPUP_PRESETS,
} from "@/lib/member/saldo-topup-constants";
import type { PaymentPricedChannel } from "@/lib/payments/payment-channel-types";

type MemberSaldoTopupClientProps = {
  memberName: string;
  memberImage: string | null;
};

function isQrisChannel(channel: PaymentPricedChannel) {
  const code = channel.code.toUpperCase();
  const name = channel.name.toUpperCase();
  const group = (channel.group || "").toUpperCase();
  return code.includes("QRIS") || name.includes("QRIS") || group === "QRIS";
}

function groupChannels(channels: PaymentPricedChannel[]) {
  const map = new Map<string, PaymentPricedChannel[]>();
  for (const channel of channels) {
    const key = channel.group || "Lainnya";
    const list = map.get(key) ?? [];
    list.push(channel);
    map.set(key, list);
  }
  return [...map.entries()];
}

function isConvenienceStoreGroup(name: string) {
  const n = name.toLowerCase();
  return n.includes("convenience") || n.includes("minimarket") || n.includes("retail");
}

function sortPaymentGroups(groups: [string, PaymentPricedChannel[]][]) {
  return [...groups].sort((a, b) => {
    const aConv = isConvenienceStoreGroup(a[0]) ? 1 : 0;
    const bConv = isConvenienceStoreGroup(b[0]) ? 1 : 0;
    return aConv - bConv;
  });
}

function ChannelIcon({ channel, className }: { channel: PaymentPricedChannel; className: string }) {
  if (!channel.iconUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={channel.iconUrl} alt="" className={className} />
  );
}

function parseCustomAmount(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function MemberSaldoTopupClient({
  memberName,
  memberImage,
}: MemberSaldoTopupClientProps) {
  const [preset, setPreset] = useState<number | "custom">(SALDO_TOPUP_PRESETS[2]);
  const [customRaw, setCustomRaw] = useState("");
  const [channels, setChannels] = useState<PaymentPricedChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  const amount = useMemo(() => {
    if (preset === "custom") return parseCustomAmount(customRaw);
    return preset;
  }, [preset, customRaw]);

  const amountValid =
    amount != null && amount >= SALDO_TOPUP_MIN && amount <= SALDO_TOPUP_MAX;

  useEffect(() => {
    if (!amountValid || amount == null) {
      setChannels([]);
      setSelectedCode(null);
      setLoadError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSelectedCode(null);

    const timer = window.setTimeout(() => {
      void getSaldoTopupPaymentOptions(amount).then((result) => {
        if (cancelled) return;
        setLoading(false);
        if (!result.ok) {
          setLoadError(result.error || "Gagal memuat metode pembayaran.");
          setChannels([]);
          return;
        }
        setChannels(result.channels);
        const qris = result.channels.filter(isQrisChannel);
        const nonQris = result.channels.filter((ch) => !isQrisChannel(ch));
        const firstGroup = qris.length > 0 ? "QRIS" : groupChannels(nonQris)[0]?.[0];
        if (firstGroup) setOpenGroups({ [firstGroup]: true });
      });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [amount, amountValid]);

  const selected = useMemo(
    () => channels.find((ch) => ch.code === selectedCode) ?? null,
    [channels, selectedCode],
  );

  const { accordionGroups, bestByGroup } = useMemo(() => {
    const qris = channels.filter(isQrisChannel);
    const rest = channels.filter((ch) => !isQrisChannel(ch));
    const groups: [string, PaymentPricedChannel[]][] = [];
    if (qris.length > 0) groups.push(["QRIS", qris]);
    groups.push(...groupChannels(rest));
    const ordered = sortPaymentGroups(groups);

    const bestByGroup = new Map<string, string>();
    for (const [groupName, items] of ordered) {
      const available = items.filter((ch) => ch.available);
      if (available.length === 0) continue;
      let minFee = Infinity;
      for (const ch of available) {
        if (ch.fee < minFee) minFee = ch.fee;
      }
      const winners = available.filter((ch) => ch.fee === minFee);
      if (winners.length === 1) {
        bestByGroup.set(groupName, winners[0].code);
      }
    }

    return { accordionGroups: ordered, bestByGroup };
  }, [channels]);

  function selectChannel(channel: PaymentPricedChannel) {
    if (!channel.available || pending) return;
    setSelectedCode(channel.code);
    setFormError(null);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 959px)").matches) {
      window.requestAnimationFrame(() => {
        document.getElementById("saldo-pay-summary")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  function toggleGroup(groupName: string) {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  }

  function pay() {
    if (!amountValid || amount == null || !selected?.available) {
      setFormError("Pilih nominal dan metode pembayaran.");
      return;
    }

    const formData = new FormData();
    formData.set("amount", String(amount));
    formData.set("paymentChannel", selected.code);

    setFormError(null);
    startTransition(() => {
      void (async () => {
        const result = await submitSaldoTopup({}, formData);
        if (result?.error) setFormError(result.error);
      })();
    });
  }

  return (
    <StorefrontSiteFrame footer="compact">
      <div className="product-pay product-pay--saldo">
      <Header
        homeHref="/"
        navPrefix="/"
        forceSolid
        memberName={memberName}
        memberImage={memberImage}
      />

      <div className="product-pay__inner">
        <Link href="/member/saldo" className="product-pay__back">
          ← Kembali ke saldo
        </Link>

        <div className="product-pay__identity">
          <div className="product-pay__identity-text">
            <p className="product-pay__category">Member</p>
            <h1 className="product-pay__title">Topup Saldo</h1>
            <p className="product-pay__lead">
              Pilih nominal, lalu metode pembayaran DOKU.
            </p>
          </div>
        </div>

        <div className="product-pay__layout">
          <div className="product-pay__main">
            <section className="product-pay__panel">
              <div className="product-pay__panel-head">
                <span className="product-pay__step-num" aria-hidden>
                  01
                </span>
                <div className="product-pay__panel-head-text">
                  <p className="product-pay__step-label">Step 1</p>
                  <h2 className="product-pay__panel-title">Pilih nominal</h2>
                </div>
                <span className="product-pay__panel-accent" aria-hidden />
              </div>
              <div className="product-pay__panel-body">
                <div className="r9host-saldo-topup__presets">
                  {SALDO_TOPUP_PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`r9host-saldo-topup__preset ${
                        preset === value ? "r9host-saldo-topup__preset--active" : ""
                      }`}
                      onClick={() => {
                        setPreset(value);
                        setFormError(null);
                      }}
                    >
                      {formatRupiah(value)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`r9host-saldo-topup__preset ${
                      preset === "custom" ? "r9host-saldo-topup__preset--active" : ""
                    }`}
                    onClick={() => {
                      setPreset("custom");
                      setFormError(null);
                    }}
                  >
                    Custom
                  </button>
                </div>
                {preset === "custom" ? (
                  <label className="r9host-saldo-topup__custom">
                    <span>Nominal custom</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={`Min ${formatRupiah(SALDO_TOPUP_MIN)}`}
                      value={customRaw}
                      onChange={(e) => setCustomRaw(e.target.value)}
                    />
                    <span className="r9host-saldo-topup__hint">
                      Min {formatRupiah(SALDO_TOPUP_MIN)} · Max {formatRupiah(SALDO_TOPUP_MAX)}
                    </span>
                    {customRaw && !amountValid ? (
                      <span className="product-pay__error">Nominal di luar batas.</span>
                    ) : null}
                  </label>
                ) : null}
              </div>
            </section>

            <section className="product-pay__panel product-pay__panel--methods">
              <div className="product-pay__panel-head">
                <span className="product-pay__step-num" aria-hidden>
                  02
                </span>
                <div className="product-pay__panel-head-text">
                  <p className="product-pay__step-label">Step 2</p>
                  <h2 className="product-pay__panel-title">Pilih pembayaran</h2>
                </div>
                <span className="product-pay__panel-accent" aria-hidden />
              </div>
              <div className="product-pay__panel-body">
                {!amountValid ? (
                  <p className="product-pay__empty">Isi nominal dulu untuk melihat metode.</p>
                ) : loading ? (
                  <p className="product-pay__empty">Memuat metode &amp; biaya admin…</p>
                ) : loadError ? (
                  <p className="product-pay__error">{loadError}</p>
                ) : channels.length === 0 ? (
                  <p className="product-pay__empty">
                    Belum ada metode pembayaran aktif. Aktifkan di Console → Payment Gateway.
                  </p>
                ) : (
                  <div className="product-pay__picker">
                    <div className="product-pay__accordions">
                      {accordionGroups.map(([groupName, items]) => {
                        const open = Boolean(openGroups[groupName]);
                        const previewIcons = items.filter((ch) => ch.iconUrl).slice(0, 8);
                        return (
                          <div
                            key={groupName}
                            className={`product-pay__accordion ${open ? "product-pay__accordion--open" : ""}`}
                          >
                            <button
                              type="button"
                              className="product-pay__accordion-toggle"
                              aria-expanded={open}
                              onClick={() => toggleGroup(groupName)}
                            >
                              <span className="product-pay__accordion-label">{groupName}</span>
                              <span className="product-pay__accordion-preview" aria-hidden>
                                {previewIcons.map((ch) => (
                                  <ChannelIcon
                                    key={ch.code}
                                    channel={ch}
                                    className="product-pay__accordion-preview-icon"
                                  />
                                ))}
                              </span>
                              <svg
                                className="product-pay__accordion-chevron"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden
                              >
                                <path
                                  d="M4 6.5 8 10.5 12 6.5"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="square"
                                />
                              </svg>
                            </button>
                            {open ? (
                              <div className="product-pay__tile-grid">
                                {items.map((channel) => {
                                  const active = selectedCode === channel.code;
                                  const isBest = bestByGroup.get(groupName) === channel.code;
                                  return (
                                    <button
                                      key={channel.code}
                                      type="button"
                                      disabled={!channel.available || pending}
                                      className={`product-pay__tile ${active ? "product-pay__tile--active" : ""}`}
                                      onClick={() => selectChannel(channel)}
                                    >
                                      {isBest ? (
                                        <span className="product-pay__best-ribbon product-pay__best-ribbon--tile">
                                          Best
                                        </span>
                                      ) : null}
                                      <span className="product-pay__tile-logo">
                                        <ChannelIcon
                                          channel={channel}
                                          className="product-pay__tile-icon"
                                        />
                                        {!channel.iconUrl ? (
                                          <span className="product-pay__tile-fallback">
                                            {channel.name.slice(0, 3)}
                                          </span>
                                        ) : null}
                                      </span>
                                      <span className="product-pay__tile-name">{channel.name}</span>
                                      <span className="product-pay__tile-total">
                                        {channel.available ? formatRupiah(channel.total) : "—"}
                                      </span>
                                      <span className="product-pay__tile-fee">
                                        {channel.available
                                          ? `${formatRupiah(amount!)} + ${
                                              channel.fee > 0
                                                ? formatRupiah(channel.fee)
                                                : "Gratis"
                                            }`
                                          : "—"}
                                      </span>
                                      {!channel.available ? (
                                        <span className="product-pay__method-hint">Limit</span>
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside
            id="saldo-pay-summary"
            className="product-pay__summary"
            aria-label="Total pembayaran"
          >
            <h2 className="product-pay__summary-title">Ringkasan</h2>
            <div className="product-pay__summary-rows">
              <div className="product-pay__summary-row">
                <span>Kredit saldo</span>
                <strong>{amountValid && amount != null ? formatRupiah(amount) : "—"}</strong>
              </div>
              <div className="product-pay__summary-row">
                <span>Biaya admin</span>
                <strong>
                  {selected ? (selected.fee > 0 ? formatRupiah(selected.fee) : "Gratis") : "—"}
                </strong>
              </div>
              <div className="product-pay__summary-row">
                <span>Metode</span>
                <strong>{selected?.name ?? "Belum dipilih"}</strong>
              </div>
            </div>
            <div className="product-pay__summary-total">
              <span>Total bayar</span>
              <strong>{selected ? formatRupiah(selected.total) : "—"}</strong>
            </div>
            <button
              type="button"
              className="product-pay__cta"
              disabled={pending || loading || !selected?.available || !amountValid}
              onClick={pay}
            >
              {pending ? "Memproses…" : "Lanjut bayar"}
            </button>
            {formError ? <p className="product-pay__error">{formError}</p> : null}
          </aside>
        </div>
      </div>

      <div className="product-pay__mobile-bar">
        <div className="product-pay__mobile-bar-inner">
          <div>
            <span className="product-pay__mobile-bar-label">Total bayar</span>
            <span className="product-pay__mobile-bar-price">
              {selected ? formatRupiah(selected.total) : "Rp —"}
            </span>
          </div>
          <button
            type="button"
            className="product-pay__mobile-bar-cta"
            disabled={pending || loading || !selected?.available || !amountValid}
            onClick={pay}
          >
            {pending ? "…" : "Bayar"}
          </button>
        </div>
      </div>
    </div>
    </StorefrontSiteFrame>
  );
}
