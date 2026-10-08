"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { StorefrontPopup } from "@/components/landing/storefront-popup";
import { useOptionalMemberLoginGate } from "@/components/member/member-login-gate";
import { formatRupiah } from "@/lib/format-rupiah";
import type { StorefrontPopupData } from "@/lib/content/popup-form";
import {
  consumeCheckoutDraftMissingToast,
  saveCheckoutDraft,
} from "@/lib/order-checkout-draft";
import {
  getOrderAccountSnapshot,
  getServerOrderAccountSnapshot,
  loadSavedOrderAccount,
  saveOrderAccountMemory,
  subscribeOrderAccountMemory,
} from "@/lib/order-account-memory";
import type { ProductOrderPageData, ProductOrderSku } from "@/lib/catalog-products/get-product-order-page";
type ProductOrderClientProps = {
  product: ProductOrderPageData;
  memberName?: string | null;
  memberImage?: string | null;
  isMember?: boolean;
  popup?: StorefrontPopupData | null;
};

type AccountDraft = {
  slug: string;
  values: Record<string, string>;
  email: string;
  whatsapp: string;
};

function requiredFieldsFilled(
  fields: ProductOrderPageData["inputFields"]["fields"],
  values: Record<string, string>,
): boolean {
  return fields.every((field) => !field.required || Boolean((values[field.key] ?? "").trim()));
}

function emptyFieldValues(fields: ProductOrderPageData["inputFields"]["fields"]) {
  const initial: Record<string, string> = {};
  for (const field of fields) {
    initial[field.key] = "";
  }
  return initial;
}

function sanitizeRestoredValues(
  fields: ProductOrderPageData["inputFields"]["fields"],
  saved: Record<string, string>,
): Record<string, string> {
  const next = emptyFieldValues(fields);
  for (const field of fields) {
    const value = (saved[field.key] ?? "").trim();
    if (!value) continue;
    if (field.type === "select" && field.options?.length) {
      if (!field.options.some((opt) => opt.value === value)) continue;
    }
    next[field.key] = value;
  }
  return next;
}

export function ProductOrderClient({
  product,
  memberName = null,
  memberImage = null,
  isMember = false,
  popup = null,
}: ProductOrderClientProps) {
  const router = useRouter();
  const gate = useOptionalMemberLoginGate();
  const memory = useSyncExternalStore(
    subscribeOrderAccountMemory,
    getOrderAccountSnapshot,
    getServerOrderAccountSnapshot,
  );

  const restoredValues = useMemo(() => {
    const allowedKeys = product.inputFields.fields.map((field) => field.key);
    const saved = loadSavedOrderAccount(memory, product.slug, allowedKeys);
    if (!saved) return emptyFieldValues(product.inputFields.fields);
    return sanitizeRestoredValues(product.inputFields.fields, saved);
  }, [memory, product.slug, product.inputFields.fields]);

  const [draft, setDraft] = useState<AccountDraft | null>(null);
  const activeDraft = draft?.slug === product.slug ? draft : null;
  const values = activeDraft?.values ?? restoredValues;
  const email = activeDraft?.email ?? memory.email;
  const whatsapp = activeDraft?.whatsapp ?? memory.whatsapp;

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const nicknameCheckId = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProductSlug = useRef(product.slug);

  if (lastProductSlug.current !== product.slug) {
    lastProductSlug.current = product.slug;
    setNickname(null);
    setRegion(null);
    setNicknameError(null);
    setNicknameChecking(false);
  }

  const canCheckNickname = Boolean(product.nicknameCheckCode?.trim());

  const filteredSkus = useMemo(() => {
    if (typeFilter === "all") return product.skus;
    return product.skus.filter((sku) => sku.productTypeId === typeFilter);
  }, [product.skus, typeFilter]);

  const selectedSku = useMemo(() => {
    const sku = product.skus.find((item) => item.id === selectedSkuId);
    if (!sku || sku.status !== "AVAILABLE") return null;
    return sku;
  }, [product.skus, selectedSkuId]);

  useEffect(() => {
    if (!activeDraft) return;
    const timer = window.setTimeout(() => {
      saveOrderAccountMemory({
        productSlug: product.slug,
        values: activeDraft.values,
        email: activeDraft.email,
        whatsapp: activeDraft.whatsapp,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [activeDraft, product.slug]);

  function resolveSelectedRegionLabel(currentValues: Record<string, string>): string | null {
    for (const field of product.inputFields.fields) {
      if (field.type !== "select" || !field.options?.length) continue;
      const key = field.key.toLowerCase();
      if (!key.includes("server") && !key.includes("region") && key !== "zone") continue;
      const selected = (currentValues[field.key] ?? "").trim();
      if (!selected) continue;
      const option = field.options.find((opt) => opt.value === selected);
      return (option?.label ?? selected).trim() || null;
    }
    return null;
  }

  function updateField(key: string, value: string) {
    setDraft({
      slug: product.slug,
      values: { ...values, [key]: value },
      email,
      whatsapp,
    });
    setNickname(null);
    setRegion(null);
    setNicknameError(null);
    setFieldErrors((prev) => {
      if (!prev.nickname && !prev[key]) return prev;
      const next = { ...prev };
      delete next.nickname;
      delete next[key];
      return next;
    });
  }

  function updateEmail(nextEmail: string) {
    setDraft({
      slug: product.slug,
      values,
      email: nextEmail,
      whatsapp,
    });
    setFieldErrors((prev) => {
      if (!prev.email) return prev;
      const next = { ...prev };
      delete next.email;
      return next;
    });
  }

  function updateWhatsapp(nextWhatsapp: string) {
    setDraft({
      slug: product.slug,
      values,
      email,
      whatsapp: nextWhatsapp,
    });
    setFieldErrors((prev) => {
      if (!prev.whatsapp) return prev;
      const next = { ...prev };
      delete next.whatsapp;
      return next;
    });
  }

  async function fetchNickname(
    currentValues: Record<string, string>,
  ): Promise<string | null> {
    if (!canCheckNickname) return null;
    if (!requiredFieldsFilled(product.inputFields.fields, currentValues)) {
      return null;
    }

    const checkId = ++nicknameCheckId.current;
    setNicknameChecking(true);
    setNicknameError(null);

    try {
      const response = await fetch("/api/nickname/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: product.slug, values: currentValues }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        nickname?: string;
        region?: string | null;
        error?: string;
      };

      if (checkId !== nicknameCheckId.current) return null;

      if (!response.ok || !payload.ok || !payload.nickname) {
        setNickname(null);
        setRegion(null);
        setNicknameError(payload.error || "Gagal cek nickname.");
        return null;
      }

      const resolvedRegion =
        (typeof payload.region === "string" && payload.region.trim()) ||
        resolveSelectedRegionLabel(currentValues);

      setNickname(payload.nickname);
      setRegion(resolvedRegion);
      setNicknameError(null);
      setFieldErrors((prev) => {
        if (!prev.nickname) return prev;
        const next = { ...prev };
        delete next.nickname;
        return next;
      });
      return payload.nickname;
    } catch {
      if (checkId !== nicknameCheckId.current) return null;
      setNickname(null);
      setRegion(null);
      setNicknameError("Gagal menghubungi server cek nickname.");
      return null;
    } finally {
      if (checkId === nicknameCheckId.current) {
        setNicknameChecking(false);
      }
    }
  }

  useEffect(() => {
    if (!canCheckNickname) return;

    if (!requiredFieldsFilled(product.inputFields.fields, values)) {
      nicknameCheckId.current += 1;
      const timer = window.setTimeout(() => setNicknameChecking(false), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      void fetchNickname(values);
    }, 550);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce on values only
  }, [values, canCheckNickname, product.inputFields.fields, product.slug]);

  function showToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const id = Date.now();
    setToast({ id, message });
    toastTimerRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }

  useEffect(() => {
    const message = consumeCheckoutDraftMissingToast();
    if (message) showToast(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount / slug
  }, [product.slug]);

  function scrollToTarget(target: string) {
    const el = document.querySelector(target);
    if (!(el instanceof HTMLElement)) return;

    const panel =
      el.closest(".product-order__panel") instanceof HTMLElement
        ? (el.closest(".product-order__panel") as HTMLElement)
        : el;

    const rect = panel.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const headerGap = 96;
    const mobileBarGap = window.matchMedia("(max-width: 959px)").matches ? 84 : 24;
    const available = Math.max(240, window.innerHeight - headerGap - mobileBarGap);
    const centered =
      absoluteTop - headerGap - Math.max(0, (available - rect.height) / 2);
    const top = Math.max(0, centered);

    window.scrollTo({ top, behavior: "smooth" });

    window.setTimeout(() => {
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
        el.focus({ preventScroll: true });
        return;
      }
      const focusable = el.querySelector("input, select, button");
      if (focusable instanceof HTMLElement) {
        focusable.focus({ preventScroll: true });
      }
    }, 320);
  }

  function validate(verifiedNickname: string | null = nickname): {
    ok: boolean;
    message: string | null;
    target: string | null;
  } {
    const nextErrors: Record<string, string> = {};
    let firstMessage: string | null = null;
    let firstTarget: string | null = null;

    function pushError(key: string, message: string, target: string) {
      nextErrors[key] = message;
      if (!firstMessage) {
        firstMessage = message;
        firstTarget = target;
      }
    }

    for (const field of product.inputFields.fields) {
      const value = (values[field.key] ?? "").trim();
      if (field.required && !value) {
        pushError(field.key, `${field.label} wajib diisi.`, `#field-${field.key}`);
      }
    }

    if (canCheckNickname && !verifiedNickname) {
      pushError("nickname", "Nickname belum terverifikasi.", "#section-input");
    }

    if (!selectedSku) {
      pushError("sku", "Pilih nominal topup terlebih dahulu.", "#section-sku");
    } else if (selectedSku.status !== "AVAILABLE") {
      pushError("sku", "Nominal tidak tersedia. Pilih nominal lain.", "#section-sku");
    }

    const mail = email.trim();
    if (!mail) {
      pushError("email", "Email wajib diisi.", "#email");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      pushError("email", "Format email tidak valid.", "#email");
    }

    const waDigits = whatsapp.replace(/\D/g, "");
    if (whatsapp.trim() && waDigits.length < 10) {
      pushError("whatsapp", "Nomor WhatsApp tidak valid.", "#whatsapp");
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError(firstMessage ?? "Lengkapi data yang masih kosong.");
      setSuccess(null);
      return { ok: false, message: firstMessage, target: firstTarget };
    }

    setFormError(null);
    return { ok: true, message: null, target: null };
  }

  async function handleContinue() {
    if (product.requiresLogin && !isMember) {
      gate?.openLoginGate(`/produk/${product.slug}`, product.name);
      showToast("Login dulu untuk membeli produk member only.");
      return;
    }

    let verifiedNickname = nickname;
    if (canCheckNickname && !verifiedNickname) {
      if (!requiredFieldsFilled(product.inputFields.fields, values)) {
        const result = validate(null);
        if (result.message) showToast(result.message);
        if (result.target) scrollToTarget(result.target);
        return;
      }

      verifiedNickname = await fetchNickname(values);
      if (!verifiedNickname) {
        const message = "Nickname belum terverifikasi. Periksa data akun.";
        setFormError(message);
        setSuccess(null);
        setFieldErrors((prev) => ({ ...prev, nickname: message }));
        showToast(message);
        scrollToTarget("#section-input");
        return;
      }
    }

    const result = validate(verifiedNickname);
    if (!result.ok || !selectedSku) {
      if (result.message) showToast(result.message);
      if (result.target) scrollToTarget(result.target);
      return;
    }

    saveOrderAccountMemory({
      productSlug: product.slug,
      values,
      email,
      whatsapp,
    });

    saveCheckoutDraft({
      productId: product.id,
      productSkuId: selectedSku.id,
      productSlug: product.slug,
      accountValues: values,
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      nickname: verifiedNickname ?? null,
      region,
      skuName: selectedSku.name,
      productName: product.name,
    });

    setSuccess(null);
    setFormError(null);
    router.push(`/produk/${product.slug}/pembayaran`);
  }

  const fieldCount = product.inputFields.fields.length;

  return (
    <StorefrontSiteFrame footer="compact">
      <div className="product-order">
      <div id="page-top" className="pointer-events-none absolute top-0 left-0 h-3 w-px" />
      <Header
        homeHref="/"
        navPrefix="/"
        forceSolid
        memberName={memberName}
        memberImage={memberImage}
      />

      {toast ? (
        <div className="product-order__toast" role="status" aria-live="polite">
          <span className="product-order__toast-tag" aria-hidden>
            INFO
          </span>
          <p className="product-order__toast-message">{toast.message}</p>
          <button
            type="button"
            className="product-order__toast-close"
            aria-label="Tutup"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      ) : null}
      <section className="product-order__hero" aria-hidden={!product.bannerUrl}>
        <div className="product-order__hero-media">
          {product.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.bannerUrl} alt="" className="product-order__hero-bg" />
          ) : (
            <div className="product-order__hero-fallback" aria-hidden />
          )}
          <div className="product-order__hero-grid" aria-hidden />
          <div className="product-order__hero-scrim" aria-hidden />
          <div className="product-order__hero-neon" aria-hidden />
        </div>
      </section>

      <div className="product-order__title-bar">
        <div className="product-order__title-row">
          <div className="product-order__thumb-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="product-order__thumb"
            />
            <span className="product-order__thumb-glow" aria-hidden />
          </div>

          <div className="product-order__title-inner">
            <p className="product-order__category">{product.categoryName}</p>
            <h1 className="product-order__name">{product.name}</h1>
            {product.subtitle ? <p className="product-order__subtitle">{product.subtitle}</p> : null}
          </div>
        </div>

        <ul className="product-order__features">
          <li className="product-order__feature">
            <span className="product-order__feature-icon product-order__feature-icon--speed" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M13 2L4 14h7l-1 8 10-13h-7l1-7z" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </span>
            <span>Proses Cepat</span>
          </li>
          <li className="product-order__feature">
            <span className="product-order__feature-icon product-order__feature-icon--chat" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path
                  d="M21 12a8 8 0 0 1-11.3 7.3L4 20l.8-3.6A8 8 0 1 1 21 12Z"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>Chat 24/7</span>
          </li>
          <li className="product-order__feature">
            <span className="product-order__feature-icon product-order__feature-icon--safe" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path
                  d="M12 3l7 3v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z"
                  strokeLinejoin="round"
                />
                <path d="M9.5 12.2l1.8 1.8 3.4-3.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>Bayar Aman</span>
          </li>
          {product.requiresLogin ? (
            <li className="product-order__feature">
              <span className="product-order__feature-icon product-order__feature-icon--member" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" strokeLinecap="round" />
                </svg>
              </span>
              <span>Member Only</span>
            </li>
          ) : null}
        </ul>
      </div>

      <div className="product-order__layout">
        <div className="product-order__stack">
          {product.guideHtml ? (
            <div>
              <button
                type="button"
                className="product-order__guide-toggle"
                aria-expanded={guideOpen}
                onClick={() => setGuideOpen((v) => !v)}
              >
                <span>Deskripsi & cara transaksi</span>
                <span aria-hidden>{guideOpen ? "▴" : "▾"}</span>
              </button>
              {guideOpen ? (
                <div
                  className="product-order__guide-body"
                  dangerouslySetInnerHTML={{ __html: product.guideHtml }}
                />
              ) : null}
            </div>
          ) : null}

          <section className="product-order__panel" id="section-input">
            <div className="product-order__panel-head">
              <span className="product-order__step-num" aria-hidden>
                01
              </span>
              <div className="product-order__panel-head-text">
                <p className="product-order__step-label">Step 1</p>
                <h2 className="product-order__panel-title">Data akun</h2>
              </div>
              <span className="product-order__panel-accent" aria-hidden />
            </div>
            <div className="product-order__panel-body">
              <div
                className={`product-order__fields ${fieldCount >= 2 ? "product-order__fields--2" : ""}`}
              >
                {product.inputFields.fields.map((field) => (
                  <div key={field.key} className="product-order__field">
                    <label htmlFor={`field-${field.key}`}>
                      {field.label}
                      {field.required ? <span className="product-order__req">*</span> : null}
                    </label>
                    {field.type === "select" ? (
                      <select
                        id={`field-${field.key}`}
                        value={values[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                      >
                        <option value="">Pilih {field.label}</option>
                        {(field.options ?? []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`field-${field.key}`}
                        type="text"
                        inputMode="text"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder={field.placeholder}
                        value={values[field.key] ?? ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                      />
                    )}
                    {fieldErrors[field.key] ? (
                      <p className="product-order__field-error">{fieldErrors[field.key]}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              {canCheckNickname ? (
                <div className="product-order__nickname" aria-live="polite">
                  {nicknameChecking ? (
                    <div className="product-order__nickname-hud product-order__nickname-hud--loading">
                      <span className="product-order__nickname-pulse" aria-hidden />
                      <p className="product-order__nickname-status">Mengecek nickname…</p>
                    </div>
                  ) : null}
                  {nickname ? (
                    <div className="product-order__nickname-hud product-order__nickname-hud--ok">
                      <span className="product-order__nickname-badge">OK</span>
                      <div className="product-order__nickname-result">
                        <p className="product-order__nickname-ok">
                          <span>Nick</span>
                          <strong>{nickname}</strong>
                        </p>
                        {region ? (
                          <p className="product-order__nickname-ok">
                            <span>Region</span>
                            <strong className="product-order__nickname-region">{region}</strong>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {nicknameError ? (
                    <p className="product-order__field-error">{nicknameError}</p>
                  ) : null}
                  {fieldErrors.nickname && !nicknameError && !nicknameChecking ? (
                    <p className="product-order__field-error">{fieldErrors.nickname}</p>
                  ) : null}
                </div>
              ) : null}

              {product.fieldHintHtml ? (
                <div
                  className="product-order__hint"
                  dangerouslySetInnerHTML={{ __html: product.fieldHintHtml }}
                />
              ) : null}
            </div>
          </section>

          <section className="product-order__panel" id="section-sku">
            <div className="product-order__panel-head">
              <span className="product-order__step-num" aria-hidden>
                02
              </span>
              <div className="product-order__panel-head-text">
                <p className="product-order__step-label">Step 2</p>
                <h2 className="product-order__panel-title">Pilih nominal</h2>
              </div>
              <span className="product-order__panel-accent" aria-hidden />
            </div>
            <div className="product-order__panel-body">
              {product.types.length > 0 ? (
                <TypeChipsScroller
                  types={product.types}
                  typeFilter={typeFilter}
                  onChange={setTypeFilter}
                />
              ) : null}

              <div className="product-order__sku-grid" role="radiogroup" aria-label="Nominal">
                {filteredSkus.length === 0 ? (
                  <p className="product-order__sku-empty">Belum ada SKU untuk filter ini.</p>
                ) : (
                  filteredSkus.map((sku) => (
                    <SkuCard
                      key={sku.id}
                      sku={sku}
                      selected={selectedSku?.id === sku.id}
                      onSelect={() => {
                        if (sku.status !== "AVAILABLE") return;
                        if (product.requiresLogin && !isMember) {
                          gate?.openLoginGate(`/produk/${product.slug}`, product.name);
                          return;
                        }
                        setSelectedSkuId(sku.id);
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.sku;
                          return next;
                        });
                      }}
                    />
                  ))
                )}
              </div>
              {fieldErrors.sku ? (
                <p className="product-order__field-error">{fieldErrors.sku}</p>
              ) : null}
            </div>
          </section>

          <section className="product-order__panel" id="section-contact">
            <div className="product-order__panel-head">
              <span className="product-order__step-num" aria-hidden>
                03
              </span>
              <div className="product-order__panel-head-text">
                <p className="product-order__step-label">Step 3</p>
                <h2 className="product-order__panel-title">Kontak</h2>
              </div>
              <span className="product-order__panel-accent" aria-hidden />
            </div>
            <div className="product-order__panel-body">
              <p className="product-order__field-note" style={{ marginBottom: "0.75rem" }}>
                Bukti &amp; cek transaksi memakai email ini.
              </p>
              <div className="product-order__field">
                <label htmlFor="email">
                  Email <span className="product-order__req">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => updateEmail(e.target.value)}
                />
                {fieldErrors.email ? (
                  <p className="product-order__field-error">{fieldErrors.email}</p>
                ) : null}
              </div>
              <div className="product-order__field" style={{ marginTop: "0.85rem" }}>
                <label htmlFor="whatsapp">WhatsApp</label>
                <input
                  id="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="08xxxxxxxxxx"
                  value={whatsapp}
                  onChange={(e) => updateWhatsapp(e.target.value)}
                />
                {fieldErrors.whatsapp ? (
                  <p className="product-order__field-error">{fieldErrors.whatsapp}</p>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <aside className="product-order__summary" aria-label="Ringkasan pesanan">
          <h2 className="product-order__summary-title">Ringkasan</h2>
          <div className="product-order__summary-row">
            <span>Produk</span>
            <span>{product.name}</span>
          </div>
          <div className="product-order__summary-row">
            <span>Nominal</span>
            <span>{selectedSku?.name ?? "—"}</span>
          </div>
          {nickname ? (
            <div className="product-order__summary-row">
              <span>Nickname</span>
              <span>{nickname}</span>
            </div>
          ) : null}
          {region ? (
            <div className="product-order__summary-row">
              <span>Region</span>
              <span>{region}</span>
            </div>
          ) : null}
          <div className="product-order__summary-price">
            <span>Total</span>
            <strong>{selectedSku ? formatRupiah(selectedSku.price) : "Rp —"}</strong>
          </div>
          <button
            type="button"
            className="product-order__cta"
            onClick={() => void handleContinue()}
            disabled={nicknameChecking}
          >
            {nicknameChecking ? "Mengecek..." : "Lanjut ke pembayaran"}
          </button>
          {formError ? <p className="product-order__form-error">{formError}</p> : null}
          {success ? <p className="product-order__success">{success}</p> : null}
        </aside>
      </div>

      <div className="product-order__mobile-bar">
        <div className="product-order__mobile-bar-inner">
          <div className="product-order__mobile-bar-total">
            <span className="product-order__mobile-bar-label">Total</span>
            <span className="product-order__mobile-bar-price">
              {selectedSku ? formatRupiah(selectedSku.price) : "Rp —"}
            </span>
          </div>
          <button
            type="button"
            className="product-order__mobile-bar-cta"
            onClick={() => void handleContinue()}
            disabled={nicknameChecking}
          >
            <span>{nicknameChecking ? "Cek..." : "Lanjut"}</span>
            {!nicknameChecking ? (
              <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="square"
                />
              </svg>
            ) : null}
          </button>
        </div>
      </div>
      </div>
      <StorefrontPopup popup={popup} />
    </StorefrontSiteFrame>
  );
}

function TypeChipsScroller({
  types,
  typeFilter,
  onChange,
}: {
  types: ProductOrderPageData["types"];
  typeFilter: string;
  onChange: (next: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(maxScroll > 2 && el.scrollLeft < maxScroll - 2);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateScrollState();
    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollState) : null;
    observer?.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, [types]);

  useEffect(() => {
    updateScrollState();
  }, [typeFilter, types]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.55), behavior: "smooth" });
  }

  return (
    <div
      className={`product-order__type-bar${canScrollLeft ? " product-order__type-bar--left" : ""}${
        canScrollRight ? " product-order__type-bar--right" : ""
      }`}
    >
      {canScrollLeft ? (
        <button
          type="button"
          className="product-order__type-nav product-order__type-nav--prev"
          aria-label="Geser tab ke kiri"
          onClick={() => scrollByDir(-1)}
        >
          ‹
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        className="product-order__type-chips"
        role="tablist"
        aria-label="Jenis produk"
      >
        <button
          type="button"
          role="tab"
          aria-selected={typeFilter === "all"}
          className={`product-order__type-chip ${typeFilter === "all" ? "product-order__type-chip--active" : ""}`}
          onClick={() => onChange("all")}
        >
          <span className="product-order__type-chip-icon product-order__type-chip-icon--grid" aria-hidden>
            <svg viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
          <span>Semua</span>
        </button>
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            role="tab"
            aria-selected={typeFilter === type.id}
            className={`product-order__type-chip ${typeFilter === type.id ? "product-order__type-chip--active" : ""}`}
            onClick={() => onChange(type.id)}
          >
            {type.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={type.iconUrl} alt="" className="product-order__type-chip-icon" />
            ) : null}
            <span>{type.name}</span>
          </button>
        ))}
      </div>

      {canScrollRight ? (
        <button
          type="button"
          className="product-order__type-nav product-order__type-nav--next"
          aria-label="Geser tab ke kanan"
          onClick={() => scrollByDir(1)}
        >
          ›
        </button>
      ) : null}
    </div>
  );
}

function parseSkuTitle(name: string): { qty: string | null; label: string; note: string | null } {
  const raw = name.trim();
  if (!raw) return { qty: null, label: "SKU", note: null };

  const noteMatch = raw.match(/\(([^)]+)\)\s*$/);
  const note = noteMatch?.[1]?.trim() || null;
  const withoutNote = noteMatch ? raw.slice(0, noteMatch.index).trim() : raw;

  const qtyMatch = withoutNote.match(/^(\d[\d.,]*)\s+(.+)$/);
  if (qtyMatch) {
    return {
      qty: qtyMatch[1],
      label: qtyMatch[2].trim(),
      note,
    };
  }

  return { qty: null, label: withoutNote, note };
}

function SkuCard({
  sku,
  selected,
  onSelect,
}: {
  sku: ProductOrderSku;
  selected: boolean;
  onSelect: () => void;
}) {
  const title = parseSkuTitle(sku.name);
  const unavailable = sku.status === "UNAVAILABLE";

  const className = [
    "product-order__sku",
    selected ? "product-order__sku--selected" : "",
    !unavailable && sku.flashPercentOff ? "product-order__sku--deal" : "",
    unavailable ? "product-order__sku--unavailable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      {unavailable ? (
        <span className="product-order__sku-unavailable">Tidak Tersedia</span>
      ) : sku.flashPercentOff ? (
        <span className="product-order__sku-off">{sku.flashPercentOff}% OFF</span>
      ) : null}

      {sku.productTypeIconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sku.productTypeIconUrl}
          alt=""
          className="product-order__sku-art"
          aria-hidden
        />
      ) : null}

      <div className="product-order__sku-body">
        {title.qty ? (
          <>
            <span className="product-order__sku-qty">{title.qty}</span>
            <span className="product-order__sku-label">{title.label}</span>
          </>
        ) : (
          <span className="product-order__sku-label product-order__sku-label--solo">{title.label}</span>
        )}
        {title.note ? <span className="product-order__sku-note">{title.note}</span> : null}
      </div>

      <div className="product-order__sku-foot">
        <div className="product-order__sku-price-wrap">
          <span className="product-order__sku-price">{formatRupiah(sku.price)}</span>
          {sku.originalPrice != null ? (
            <span className="product-order__sku-old">{formatRupiah(sku.originalPrice)}</span>
          ) : null}
        </div>
      </div>
    </>
  );

  if (unavailable) {
    return (
      <div className={className} aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={className}
      onClick={onSelect}
    >
      {body}
    </button>
  );
}
