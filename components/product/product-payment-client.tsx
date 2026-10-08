"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { getCheckoutPaymentOptions, submitCheckout } from "@/app/actions/checkout";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { useOptionalMemberLoginGate } from "@/components/member/member-login-gate";
import { formatRupiah } from "@/lib/format-rupiah";
import {
  clearCheckoutDraft,
  flagCheckoutDraftMissingToast,
  loadCheckoutDraft,
  type OrderCheckoutDraft,
} from "@/lib/order-checkout-draft";
import type { ProductOrderPageData } from "@/lib/catalog-products/get-product-order-page";
import type { PaymentPricedChannel } from "@/lib/payments/payment-channel-types";

type ProductPaymentClientProps = {
  product: ProductOrderPageData;
  memberName?: string | null;
  memberImage?: string | null;
  isMember?: boolean;
  memberWallet?: { saldo: number; poin: number } | null;
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

/** Urutan grup: QRIS dulu, Convenience Store paling bawah. */
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

export function ProductPaymentClient({
  product,
  memberName = null,
  memberImage = null,
  isMember = false,
  memberWallet = null,
}: ProductPaymentClientProps) {
  const router = useRouter();
  const gate = useOptionalMemberLoginGate();
  const [draft, setDraft] = useState<OrderCheckoutDraft | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [channels, setChannels] = useState<PaymentPricedChannel[]>([]);
  const [itemSubtotal, setItemSubtotal] = useState(0);
  const [priceSnapshot, setPriceSnapshot] = useState(0);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [skuName, setSkuName] = useState("");
  const [wallet, setWallet] = useState<{ saldo: number; poin: number } | null>(
    memberWallet,
  );
  const [usePoin, setUsePoin] = useState(false);
  const [useSaldo, setUseSaldo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const hasLoadedChannelsRef = useRef(false);
  const payingRef = useRef(false);

  useEffect(() => {
    const loaded = loadCheckoutDraft(product.slug);
    setDraft(loaded);
    setDraftReady(true);
    if (!loaded || loaded.productId !== product.id) {
      flagCheckoutDraftMissingToast();
      router.replace(`/produk/${product.slug}`);
    }
  }, [product.id, product.slug, router]);

  useEffect(() => {
    if (!draft || draft.productId !== product.id) return;

    let cancelled = false;
    const isInitial = !hasLoadedChannelsRef.current;
    if (isInitial) {
      setLoading(true);
      setLoadError(null);
    }

    void getCheckoutPaymentOptions({
      productId: draft.productId,
      productSkuId: draft.productSkuId,
      usePoin,
      voucherCode: appliedVoucherCode || undefined,
      email: draft.email,
      accountValues: draft.accountValues,
    }).then((result) => {
      if (cancelled) return;
      if (isInitial) setLoading(false);
      if (!result.ok || !result.data) {
        if (isInitial) {
          setLoadError(result.error || "Gagal memuat metode pembayaran.");
          setChannels([]);
          setChannelError(null);
        }
        return;
      }
      hasLoadedChannelsRef.current = true;
      setLoadError(null);
      setItemSubtotal(result.data.itemSubtotal);
      setPriceSnapshot(result.data.priceSnapshot);
      setVoucherDiscount(result.data.voucherDiscount);
      setVoucherError(result.data.voucherError);
      setChannelError(result.data.channelError);
      if (result.data.voucherCode) {
        setAppliedVoucherCode(result.data.voucherCode);
        setVoucherInput(result.data.voucherCode);
      }
      setSkuName(result.data.skuName);
      setChannels(result.data.channels);
      if (result.data.wallet) {
        setWallet(result.data.wallet);
      } else if (!isMember) {
        setWallet(null);
      }

      setSelectedCode((prev) => {
        if (prev && result.data.channels.some((ch) => ch.code === prev && ch.available)) {
          return prev;
        }
        return null;
      });

      if (isInitial) {
        const walletBal = result.data.wallet;
        const remaining =
          result.data.poinPreview?.remainingAfterPoin ?? result.data.priceSnapshot;
        const saldoCukup =
          Boolean(walletBal && remaining > 0 && walletBal.saldo >= remaining);
        // Saldo cukup → jangan auto-buka QRIS; biarkan user pilih Saldo dulu.
        if (!saldoCukup) {
          const qris = result.data.channels.filter(isQrisChannel);
          const nonQris = result.data.channels.filter((ch) => !isQrisChannel(ch));
          const firstGroup = qris.length > 0 ? "QRIS" : groupChannels(nonQris)[0]?.[0];
          if (firstGroup) {
            setOpenGroups({ [firstGroup]: true });
          }
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [draft, product.id, usePoin, isMember, appliedVoucherCode]);

  const isFreeOrder = priceSnapshot === 0;
  const poinUsed = usePoin && wallet ? Math.min(wallet.poin, priceSnapshot) : 0;
  const remainingAfterPoin = Math.max(0, priceSnapshot - poinUsed);
  const canPayWithSaldo =
    Boolean(isMember && wallet && remainingAfterPoin > 0 && wallet.saldo >= remainingAfterPoin);
  const fullyCoveredByPoin = usePoin && remainingAfterPoin === 0 && priceSnapshot > 0;
  const payWithSaldo = useSaldo && canPayWithSaldo;
  const skipGateway = isFreeOrder || payWithSaldo || fullyCoveredByPoin;

  useEffect(() => {
    if (!canPayWithSaldo && useSaldo) setUseSaldo(false);
  }, [canPayWithSaldo, useSaldo]);

  useEffect(() => {
    if ((!wallet || wallet.poin < 1) && usePoin) setUsePoin(false);
  }, [wallet, usePoin]);

  const selected = useMemo(
    () => channels.find((ch) => ch.code === selectedCode) ?? null,
    [channels, selectedCode],
  );

  // Total = sisa setelah poin + fee channel (bukan selected.total mentah,
  // supaya centang poin langsung mengurangi total tanpa menunggu refetch).
  const payableTotal = skipGateway
    ? remainingAfterPoin
    : selected
      ? remainingAfterPoin + selected.fee
      : null;
  const payableFee = skipGateway ? 0 : selected?.fee ?? null;

  const { accordionGroups, bestByGroup } = useMemo(() => {
    const qris = channels.filter(isQrisChannel);
    const rest = channels.filter((ch) => !isQrisChannel(ch));
    const groups: [string, PaymentPricedChannel[]][] = [];
    if (qris.length > 0) groups.push(["QRIS", qris]);
    groups.push(...groupChannels(rest));
    const ordered = sortPaymentGroups(groups);

    // BEST per grup = fee termurah unik. Fee sama → tanpa badge.
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

    return {
      accordionGroups: ordered,
      bestByGroup,
    };
  }, [channels]);

  function selectChannel(channel: PaymentPricedChannel) {
    if (!channel.available || pending) return;
    setSelectedCode(channel.code);
    setUseSaldo(false);
    setFormError(null);

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 959px)").matches) {
      window.requestAnimationFrame(() => {
        document.getElementById("product-pay-summary")?.scrollIntoView({
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
    if (payingRef.current || pending) return;
    if (product.requiresLogin && !isMember) {
      gate?.openLoginGate(`/produk/${product.slug}/pembayaran`, product.name);
      setFormError("Login dulu untuk membeli produk member only.");
      return;
    }
    if (!draft) {
      setFormError("Data pesanan tidak valid.");
      return;
    }
    if (!skipGateway && (!selected || !selected.available)) {
      setFormError("Pilih metode pembayaran.");
      return;
    }

    const formData = new FormData();
    formData.set("idempotencyKey", draft.idempotencyKey);
    formData.set("productId", draft.productId);
    formData.set("productSkuId", draft.productSkuId);
    formData.set("paymentChannel", skipGateway ? "SALDO" : selected!.code);
    formData.set("email", draft.email);
    formData.set("whatsapp", draft.whatsapp ?? "");
    formData.set("nickname", draft.nickname ?? "");
    formData.set("accountValues", JSON.stringify(draft.accountValues));
    formData.set("usePoin", usePoin ? "1" : "0");
    formData.set("useSaldo", payWithSaldo ? "1" : "0");
    if (appliedVoucherCode) {
      formData.set("voucherCode", appliedVoucherCode);
    }

    setFormError(null);
    payingRef.current = true;
    startTransition(() => {
      void (async () => {
        const result = await submitCheckout({}, formData);
        if (result?.error) {
          payingRef.current = false;
          setFormError(result.error);
          return;
        }
        clearCheckoutDraft(product.slug);
      })();
    });
  }

  if (!draftReady || !draft || draft.productId !== product.id) {
    return (
      <div className="product-pay">
        <Header
          homeHref="/"
          navPrefix="/"
          forceSolid
          memberName={memberName}
          memberImage={memberImage}
        />
        <div className="product-pay__inner">
          <p className="product-pay__empty">Mengalihkan ke halaman order…</p>
        </div>
      </div>
    );
  }

  const checkoutDraft = draft;
  const playerId =
    checkoutDraft.accountValues.userId ||
    checkoutDraft.accountValues.userid ||
    Object.values(checkoutDraft.accountValues)[0] ||
    "—";
  const zone = checkoutDraft.accountValues.zone || checkoutDraft.accountValues.server || null;

  return (
    <StorefrontSiteFrame footer="compact">
      <div className="product-pay">
      <Header
        homeHref="/"
        navPrefix="/"
        forceSolid
        memberName={memberName}
        memberImage={memberImage}
      />

      <section className="product-pay__hero" aria-hidden>
        <div className="product-pay__hero-media">
          {product.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.bannerUrl} alt="" className="product-pay__hero-bg" />
          ) : product.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.thumbnailUrl} alt="" className="product-pay__hero-bg" />
          ) : (
            <div className="product-pay__hero-fallback" />
          )}
          <div className="product-pay__hero-scrim" />
          <div className="product-pay__hero-glow" />
        </div>
      </section>

      <div className="product-pay__inner">
        <Link href={`/produk/${product.slug}`} className="product-pay__back">
          ← Kembali ke order
        </Link>

        <div className="product-pay__identity">
          <div className="product-pay__thumb-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="product-pay__thumb"
            />
            <span className="product-pay__thumb-glow" aria-hidden />
          </div>
          <div className="product-pay__identity-text">
            <p className="product-pay__category">{product.categoryName}</p>
            <h1 className="product-pay__title">{product.name}</h1>
            <p className="product-pay__lead">
              {skuName || checkoutDraft.skuName}
              {checkoutDraft.nickname ? ` · ${checkoutDraft.nickname}` : ""}
            </p>
          </div>
        </div>

        <div className="product-pay__layout">
          <div className="product-pay__main">
            <section className="product-pay__panel product-pay__panel--order">
              <div className="product-pay__panel-head">
                <span className="product-pay__step-num" aria-hidden>
                  03
                </span>
                <div className="product-pay__panel-head-text">
                  <p className="product-pay__step-label">Step 3</p>
                  <h2 className="product-pay__panel-title">Ringkasan order</h2>
                </div>
                <span className="product-pay__panel-accent" aria-hidden />
              </div>
              <div className="product-pay__panel-body product-pay__panel-body--order">
                <div className="product-pay__order-card">
                  <div className="product-pay__order-art">
                    {product.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.bannerUrl}
                        alt=""
                        className="product-pay__order-banner"
                      />
                    ) : null}
                  </div>
                  <div className="product-pay__order-body">
                    <p className="product-pay__order-product">{product.name}</p>
                    <p className="product-pay__order-sku">{skuName || checkoutDraft.skuName}</p>
                    <dl className="product-pay__meta">
                      <div className="product-pay__meta-row">
                        <dt>ID / Target</dt>
                        <dd>
                          {playerId}
                          {zone ? ` (${zone})` : ""}
                        </dd>
                      </div>
                      {checkoutDraft.nickname ? (
                        <div className="product-pay__meta-row">
                          <dt>Nickname</dt>
                          <dd>{checkoutDraft.nickname}</dd>
                        </div>
                      ) : null}
                      {checkoutDraft.region ? (
                        <div className="product-pay__meta-row">
                          <dt>Region</dt>
                          <dd>{checkoutDraft.region}</dd>
                        </div>
                      ) : null}
                      <div className="product-pay__meta-row">
                        <dt>Email</dt>
                        <dd>{checkoutDraft.email}</dd>
                      </div>
                      {checkoutDraft.whatsapp ? (
                        <div className="product-pay__meta-row">
                          <dt>WhatsApp</dt>
                          <dd>{checkoutDraft.whatsapp}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </div>
              </div>
            </section>

            <section className="product-pay__panel product-pay__panel--methods">
              <div className="product-pay__panel-head">
                <span className="product-pay__step-num" aria-hidden>
                  04
                </span>
                <div className="product-pay__panel-head-text">
                  <p className="product-pay__step-label">Step 4</p>
                  <h2 className="product-pay__panel-title">Pilih pembayaran</h2>
                </div>
                <span className="product-pay__panel-accent" aria-hidden />
              </div>

              <div className="product-pay__panel-body">
              {isMember && wallet ? (
                <div className="product-pay__wallet">
                  <button
                    type="button"
                    className={`product-pay__saldo-card ${payWithSaldo ? "product-pay__saldo-card--active" : ""} ${!canPayWithSaldo ? "product-pay__saldo-card--disabled" : ""}`}
                    disabled={!canPayWithSaldo || pending || loading}
                    onClick={() => {
                      if (!canPayWithSaldo) return;
                      const next = !payWithSaldo;
                      setUseSaldo(next);
                      if (next) setSelectedCode(null);
                      setFormError(null);
                    }}
                  >
                    {canPayWithSaldo ? (
                      <span className="product-pay__saldo-ribbon">Best</span>
                    ) : null}
                    <span className="product-pay__saldo-icon" aria-hidden>
                      <svg viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="18" fill="#1a1a00" stroke="var(--color-neon, #ff7a1a)" strokeWidth="1.5" />
                        <path
                          d="M12 17.5h16c.8 0 1.5.7 1.5 1.5v8c0 .8-.7 1.5-1.5 1.5H12c-.8 0-1.5-.7-1.5-1.5v-8c0-.8.7-1.5 1.5-1.5Z"
                          stroke="var(--color-neon, #ff7a1a)"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M12 17.5V15c0-1.4 1.1-2.5 2.5-2.5H22"
                          stroke="var(--color-neon, #ff7a1a)"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        <circle cx="26.5" cy="23" r="1.6" fill="var(--color-neon, #ff7a1a)" />
                      </svg>
                    </span>
                    <span className="product-pay__saldo-body">
                      <span className="product-pay__saldo-name">Saldo</span>
                      <span className="product-pay__saldo-max">
                        Max. {formatRupiah(wallet.saldo)}
                      </span>
                    </span>
                  </button>
                </div>
              ) : null}

              {loading ? (
                <p className="product-pay__empty">Memuat metode &amp; biaya admin…</p>
              ) : loadError ? (
                <p className="product-pay__error">{loadError}</p>
              ) : channelError && !skipGateway ? (
                <p className="product-pay__error">{channelError}</p>
              ) : channels.length === 0 && !skipGateway ? (
                <p className="product-pay__empty">
                  Belum ada metode pembayaran aktif. Aktifkan di Console → Payment Gateway.
                </p>
              ) : channels.length === 0 && skipGateway ? (
                <p className="product-pay__empty">
                  Total Rp 0 — tidak perlu metode pembayaran eksternal.
                </p>
              ) : (
                <div className="product-pay__picker">
                  <div className="product-pay__accordions">
                    {accordionGroups.map(([groupName, items]) => {
                      const open = Boolean(openGroups[groupName]);
                      const previewIcons = items
                        .filter((ch) => ch.iconUrl)
                        .slice(0, 8);
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
                                      {channel.available
                                        ? formatRupiah(remainingAfterPoin + channel.fee)
                                        : "—"}
                                    </span>
                                    <span className="product-pay__tile-fee">
                                      {channel.available
                                        ? `${formatRupiah(remainingAfterPoin || priceSnapshot)} + ${
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
            id="product-pay-summary"
            className="product-pay__summary"
            aria-label="Total pembayaran"
          >
            <div className="product-pay__summary-product">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.thumbnailUrl}
                alt=""
                className="product-pay__summary-thumb"
              />
              <div>
                <p className="product-pay__summary-game">{product.name}</p>
                <p className="product-pay__summary-sku">{skuName || checkoutDraft.skuName}</p>
              </div>
            </div>
            <h2 className="product-pay__summary-title">Total</h2>
            <div className="product-pay__voucher">
              <label className="product-pay__voucher-label" htmlFor="voucher-code">
                Kode voucher
              </label>
              <div className="product-pay__voucher-row">
                <input
                  id="voucher-code"
                  type="text"
                  className="product-pay__voucher-input"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="PROMO10"
                  disabled={pending || loading}
                />
                {appliedVoucherCode ? (
                  <button
                    type="button"
                    className="product-pay__voucher-btn product-pay__voucher-btn--ghost"
                    disabled={pending || loading}
                    onClick={() => {
                      setAppliedVoucherCode("");
                      setVoucherInput("");
                      setVoucherError(null);
                    }}
                  >
                    Hapus
                  </button>
                ) : (
                  <button
                    type="button"
                    className="product-pay__voucher-btn"
                    disabled={pending || loading || !voucherInput.trim()}
                    onClick={() => {
                      setAppliedVoucherCode(voucherInput.trim().toUpperCase());
                      setVoucherError(null);
                    }}
                  >
                    Terapkan
                  </button>
                )}
              </div>
              {voucherError ? (
                <p className="product-pay__voucher-error">{voucherError}</p>
              ) : appliedVoucherCode ? (
                <p className="product-pay__voucher-ok">Voucher {appliedVoucherCode} diterapkan</p>
              ) : null}
            </div>
            <div className="product-pay__summary-rows">
              <div className="product-pay__summary-row">
                <span>Subtotal</span>
                <strong>{itemSubtotal ? formatRupiah(itemSubtotal) : "—"}</strong>
              </div>
              {voucherDiscount > 0 ? (
                <div className="product-pay__summary-row product-pay__summary-row--discount">
                  <span>Diskon voucher</span>
                  <strong>−{formatRupiah(voucherDiscount)}</strong>
                </div>
              ) : null}
              <div className="product-pay__summary-row">
                <span>Harga item</span>
                <strong>{formatRupiah(priceSnapshot)}</strong>
              </div>
              {isMember && wallet && wallet.poin > 0 ? (
                <label className="product-pay__summary-poin">
                  <span className="product-pay__summary-poin-check">
                    <input
                      type="checkbox"
                      className="product-pay__check"
                      checked={usePoin}
                      disabled={pending || loading}
                      onChange={(event) => {
                        setUsePoin(event.target.checked);
                        setFormError(null);
                      }}
                    />
                    Gunakan poin
                    <span className="product-pay__summary-poin-meta">
                      Poin anda = {formatRupiah(wallet.poin)}
                    </span>
                  </span>
                  <strong>{usePoin && poinUsed > 0 ? `−${formatRupiah(poinUsed)}` : "—"}</strong>
                </label>
              ) : null}
              {payWithSaldo ? (
                <div className="product-pay__summary-row">
                  <span>Bayar saldo</span>
                  <strong>−{formatRupiah(remainingAfterPoin)}</strong>
                </div>
              ) : null}
              <div className="product-pay__summary-row">
                <span>Biaya admin</span>
                <strong>
                  {skipGateway
                    ? "Gratis"
                    : payableFee != null
                      ? payableFee > 0
                        ? formatRupiah(payableFee)
                        : "Gratis"
                      : "—"}
                </strong>
              </div>
              <div className="product-pay__summary-row">
                <span>Metode</span>
                <strong>
                  {skipGateway
                    ? isFreeOrder
                      ? "Voucher (gratis)"
                      : fullyCoveredByPoin
                        ? "Poin"
                        : "Saldo"
                    : (selected?.name ?? "Belum dipilih")}
                </strong>
              </div>
            </div>
            <div className="product-pay__summary-total">
              <span>Total bayar</span>
              <strong>
                {payableTotal != null ? formatRupiah(payableTotal) : "—"}
              </strong>
            </div>
            <button
              type="button"
              className="product-pay__cta"
              disabled={
                pending ||
                loading ||
                (!skipGateway && !selected?.available)
              }
              onClick={pay}
            >
              {pending ? "Memproses…" : "Bayar sekarang"}
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
              {payableTotal != null ? formatRupiah(payableTotal) : "Rp —"}
            </span>
          </div>
          <button
            type="button"
            className="product-pay__mobile-bar-cta"
            disabled={
              pending ||
              loading ||
              (!skipGateway && !selected?.available)
            }
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
