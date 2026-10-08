-- AlterTable
ALTER TABLE `product_skus` ADD COLUMN `providerCatalogBrand` VARCHAR(500) NULL;

-- Backfill from product_providers.filters (only when SKU brand is empty)
UPDATE `product_skus` AS sku
INNER JOIN `product_providers` AS pp
  ON pp.`productId` = sku.`productId` AND pp.`providerId` = sku.`providerId`
INNER JOIN `fulfillment_providers` AS fp ON fp.`id` = sku.`providerId`
SET sku.`providerCatalogBrand` = CASE
  WHEN fp.`slug` = 'melostore' THEN NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(pp.`filters`, '$.brandName'))), '')
  WHEN fp.`slug` = 'digiflazz' THEN NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(pp.`filters`, '$.brand'))), '')
  WHEN fp.`slug` = 'iak' THEN NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(pp.`filters`, '$.operator'))), '')
  ELSE sku.`providerCatalogBrand`
END
WHERE sku.`providerCatalogBrand` IS NULL OR sku.`providerCatalogBrand` = '';
