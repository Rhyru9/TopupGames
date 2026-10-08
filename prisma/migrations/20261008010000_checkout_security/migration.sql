-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "checkoutFingerprint" VARCHAR(64),
ADD COLUMN     "checkoutKey" VARCHAR(64),
ADD COLUMN     "flashSaleItemId" TEXT,
ADD COLUMN     "flashSaleReleasedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "orders_checkoutKey_key" ON "orders"("checkoutKey");

-- CreateIndex
CREATE INDEX "orders_flashSaleItemId_idx" ON "orders"("flashSaleItemId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_flashSaleItemId_fkey" FOREIGN KEY ("flashSaleItemId") REFERENCES "flash_sale_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
