import { ProductSkuStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ProductFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

type ProductFormInput = {
  productId: string;
  productTypeId: string;
  name: string;
  providerId: string;
  providerSku: string;
  costPrice: number;
  marginGuest: number;
  marginMember: number;
  cashbackPoin: number;
  status: ProductSkuStatus;
  note: string;
  keepCustomName: boolean;
  providerCatalogBrand: string;
};

function parseIntField(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export function parseProductForm(formData: FormData): ProductFormInput {
  const status = formData.get("status");

  return {
    productId: String(formData.get("productId") ?? "").trim(),
    productTypeId: String(formData.get("productTypeId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    providerId: String(formData.get("providerId") ?? "").trim(),
    providerSku: String(formData.get("providerSku") ?? "").trim(),
    costPrice: parseIntField(formData.get("costPrice")),
    marginGuest: parseIntField(formData.get("marginGuest")),
    marginMember: parseIntField(formData.get("marginMember")),
    cashbackPoin: parseIntField(formData.get("cashbackPoin")),
    status: Object.values(ProductSkuStatus).includes(status as ProductSkuStatus)
      ? (status as ProductSkuStatus)
      : ProductSkuStatus.AVAILABLE,
    note: String(formData.get("note") ?? "").trim(),
    keepCustomName: formData.get("keepCustomName") === "on",
    providerCatalogBrand: String(formData.get("providerCatalogBrand") ?? "").trim(),
  };
}

export function validateProductInput(input: ProductFormInput): ProductFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.productId) fieldErrors.productId = "Produk wajib dipilih.";
  if (!input.name) fieldErrors.name = "Nama SKU wajib diisi.";
  if (!input.providerId) fieldErrors.providerId = "Provider wajib dipilih.";
  if (!input.providerSku) fieldErrors.providerSku = "SKU provider wajib diisi.";
  if (input.costPrice < 0) fieldErrors.costPrice = "Harga modal tidak boleh negatif.";
  if (input.marginGuest < 0) fieldErrors.marginGuest = "Margin guest tidak boleh negatif.";
  if (input.marginMember < 0) fieldErrors.marginMember = "Margin member tidak boleh negatif.";
  if (input.cashbackPoin < 0) fieldErrors.cashbackPoin = "Cashback poin tidak boleh negatif.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

async function assertProduct(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  return Boolean(product);
}

async function assertProvider(providerId: string, existingProviderId?: string) {
  if (existingProviderId && providerId === existingProviderId) {
    const provider = await prisma.fulfillmentProvider.findUnique({ where: { id: providerId } });
    return Boolean(provider);
  }

  const provider = await prisma.fulfillmentProvider.findFirst({
    where: { id: providerId, isActive: true },
  });
  return Boolean(provider);
}

async function assertSkuUnique(
  productId: string,
  providerId: string,
  providerSku: string,
  productSkuId?: string,
) {
  const existing = await prisma.productSku.findFirst({
    where: {
      productId,
      providerId,
      providerSku,
      ...(productSkuId ? { NOT: { id: productSkuId } } : {}),
    },
  });
  return !existing;
}

function buildPrices(input: ProductFormInput) {
  return {
    priceGuest: input.costPrice + input.marginGuest,
    priceMember: input.costPrice + input.marginMember,
  };
}

export async function persistProduct(
  input: ProductFormInput,
  productSkuId?: string,
): Promise<ProductFormState | null> {
  const existing = productSkuId
    ? await prisma.productSku.findUnique({ where: { id: productSkuId } })
    : null;

  if (productSkuId && !existing) {
    return { error: "SKU tidak ditemukan." };
  }

  const validProduct = await assertProduct(input.productId);
  if (!validProduct) {
    return { fieldErrors: { productId: "Produk tidak valid." } };
  }

  const validProvider = await assertProvider(input.providerId, existing?.providerId);
  if (!validProvider) {
    return { fieldErrors: { providerId: "Provider tidak valid." } };
  }

  const skuUnique = await assertSkuUnique(
    input.productId,
    input.providerId,
    input.providerSku,
    productSkuId,
  );
  if (!skuUnique) {
    return { fieldErrors: { providerSku: "Kode SKU sudah dipakai SKU lain di produk + provider ini." } };
  }

  if (input.productTypeId) {
    const productType = await prisma.productType.findFirst({
      where: { id: input.productTypeId, productId: input.productId },
    });
    if (!productType) {
      return { fieldErrors: { productTypeId: "Jenis produk tidak valid untuk produk ini." } };
    }
  }

  const prices = buildPrices(input);
  const data = {
    productId: input.productId,
    productTypeId: input.productTypeId || null,
    name: input.name,
    providerId: input.providerId,
    providerSku: input.providerSku,
    keepCustomName: input.keepCustomName,
    costPrice: input.costPrice,
    marginGuest: input.marginGuest,
    marginMember: input.marginMember,
    cashbackPoin: input.cashbackPoin,
    priceGuest: prices.priceGuest,
    priceMember: prices.priceMember,
    status: input.status,
    note: input.note || null,
    providerCatalogBrand: input.providerCatalogBrand || null,
  };

  if (existing) {
    await prisma.productSku.update({ where: { id: existing.id }, data });
    return null;
  }

  await prisma.productSku.create({ data });
  return null;
}
