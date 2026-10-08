import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ProductForm } from "@/components/console/product-skus/product-form";
import { getProductOptionsForSku } from "@/lib/catalog-products/game-options";
import { getFulfillmentProvidersForProduct } from "@/lib/fulfillment-providers";
import { getAllProductTypeOptions } from "@/lib/catalog-products/game-catalog-data";
import { prisma } from "@/lib/prisma";

type EditNominalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditNominalPage({ params }: EditNominalPageProps) {
  const { id } = await params;

  const productSku = await prisma.productSku.findUnique({ where: { id } });
  if (!productSku) notFound();

  const [products, providers, productTypes] = await Promise.all([
    getProductOptionsForSku(productSku.productId),
    getFulfillmentProvidersForProduct(productSku.providerId),
    getAllProductTypeOptions(),
  ]);

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title={`Edit ${productSku.name}`}
        description="Perbarui SKU, harga modal, margin, brand provider, cashback poin, dan status."
        backLink={{ href: "/console/product-skus", label: "← Kembali ke daftar SKU" }}
      />

      <div className="console-panel console-panel--padded">
        <ProductForm
          mode="edit"
          productSkuId={productSku.id}
          products={products}
          providers={providers}
          productTypes={productTypes}
          initialValues={{
            productId: productSku.productId,
            productTypeId: productSku.productTypeId ?? "",
            name: productSku.name,
            providerId: productSku.providerId,
            providerSku: productSku.providerSku,
            costPrice: productSku.costPrice,
            marginGuest: productSku.marginGuest,
            marginMember: productSku.marginMember,
            cashbackPoin: productSku.cashbackPoin,
            status: productSku.status,
            note: productSku.note ?? "",
            keepCustomName: productSku.keepCustomName,
            providerCatalogBrand: productSku.providerCatalogBrand ?? "",
          }}
        />
      </div>
    </div>
  );
}
