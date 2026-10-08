import {
  PromoVoucherDiscountType,
  PromoVoucherType,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizeVoucherCode,
  parseDatetimeLocal,
} from "@/lib/promo/voucher-shared";

export type VoucherFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type VoucherFormInput = {
  code: string;
  label: string | null;
  type: PromoVoucherType;
  discountType: PromoVoucherDiscountType;
  discountValue: number;
  maxDiscount: number;
  minOrderAmount: number;
  stock: number;
  perUserLimit: number;
  isEnabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

export function parseVoucherForm(formData: FormData): {
  input?: VoucherFormInput;
  error?: VoucherFormState;
} {
  const code = normalizeVoucherCode(String(formData.get("code") ?? ""));
  const label = String(formData.get("label") ?? "").trim() || null;
  const typeRaw = String(formData.get("type") ?? "").trim();
  const discountTypeRaw = String(formData.get("discountType") ?? "").trim();
  const discountValue = Number(formData.get("discountValue"));
  const maxDiscount = Number(formData.get("maxDiscount") ?? 0);
  const minOrderAmount = Number(formData.get("minOrderAmount") ?? 0);
  const stock = Number(formData.get("stock"));
  const perUserLimit = Number(formData.get("perUserLimit") ?? 0);
  const isEnabled = formData.get("isEnabled") === "on" || formData.get("isEnabled") === "true";
  const startsAt = parseDatetimeLocal(String(formData.get("startsAt") ?? ""));
  const endsAt = parseDatetimeLocal(String(formData.get("endsAt") ?? ""));

  const fieldErrors: Record<string, string> = {};
  if (!code) fieldErrors.code = "Kode wajib diisi.";
  if (code.length > 40) fieldErrors.code = "Kode maksimal 40 karakter.";
  if (typeRaw !== "GENERAL" && typeRaw !== "SPECIAL") {
    fieldErrors.type = "Tipe voucher tidak valid.";
  }
  if (discountTypeRaw !== "PERCENT" && discountTypeRaw !== "FIXED") {
    fieldErrors.discountType = "Jenis diskon tidak valid.";
  }
  if (!Number.isFinite(discountValue) || discountValue < 1) {
    fieldErrors.discountValue = "Nilai diskon wajib diisi.";
  }
  if (!Number.isFinite(maxDiscount) || maxDiscount < 0) {
    fieldErrors.maxDiscount = "Max potongan tidak valid.";
  }
  if (!Number.isFinite(stock) || stock < 1) {
    fieldErrors.stock = "Stok minimal 1.";
  }
  if (!Number.isFinite(perUserLimit) || perUserLimit < 0) {
    fieldErrors.perUserLimit = "Batas per pengguna tidak valid.";
  }
  if (startsAt && endsAt && endsAt <= startsAt) {
    fieldErrors.endsAt = "Waktu selesai harus setelah waktu mulai.";
  }

  const type = typeRaw as PromoVoucherType;
  const discountType = discountTypeRaw as PromoVoucherDiscountType;

  let resolvedMin = Math.trunc(minOrderAmount);
  let resolvedPerUser = Math.trunc(perUserLimit);

  if (type === PromoVoucherType.SPECIAL) {
    resolvedMin = 0;
    resolvedPerUser = 1;
  } else if (resolvedMin < 1) {
    fieldErrors.minOrderAmount = "Minimal transaksi wajib untuk voucher umum.";
  }

  if (discountType === PromoVoucherDiscountType.PERCENT) {
    if (discountValue > 100) fieldErrors.discountValue = "Persen maksimal 100.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: { fieldErrors } };
  }

  return {
    input: {
      code,
      label,
      type,
      discountType,
      discountValue: Math.trunc(discountValue),
      maxDiscount: Math.trunc(maxDiscount),
      minOrderAmount: resolvedMin,
      stock: Math.trunc(stock),
      perUserLimit: resolvedPerUser,
      isEnabled,
      startsAt,
      endsAt,
    },
  };
}

export async function persistPromoVoucher(
  input: VoucherFormInput,
  voucherId?: string,
): Promise<VoucherFormState | null> {
  const duplicate = await prisma.promoVoucher.findFirst({
    where: {
      code: input.code,
      ...(voucherId ? { NOT: { id: voucherId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    return { error: "Kode voucher sudah dipakai." };
  }

  const data = {
    code: input.code,
    label: input.label,
    type: input.type,
    discountType: input.discountType,
    discountValue: input.discountValue,
    maxDiscount: input.maxDiscount,
    minOrderAmount: input.minOrderAmount,
    stock: input.stock,
    perUserLimit: input.perUserLimit,
    isEnabled: input.isEnabled,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  };

  if (voucherId) {
    const existing = await prisma.promoVoucher.findUnique({ where: { id: voucherId } });
    if (!existing) return { error: "Voucher tidak ditemukan." };
    if (input.stock < existing.usedCount) {
      return {
        error: `Stok tidak boleh di bawah jumlah terpakai (${existing.usedCount}).`,
      };
    }
    await prisma.promoVoucher.update({ where: { id: voucherId }, data });
    return null;
  }

  await prisma.promoVoucher.create({ data });
  return null;
}
