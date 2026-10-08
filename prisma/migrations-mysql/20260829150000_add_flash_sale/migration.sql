-- CreateTable
CREATE TABLE `flash_sales` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `flash_sales_isEnabled_startsAt_endsAt_idx`(`isEnabled`, `startsAt`, `endsAt`),
    INDEX `flash_sales_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flash_sale_items` (
    `id` VARCHAR(191) NOT NULL,
    `flashSaleId` VARCHAR(191) NOT NULL,
    `productSkuId` VARCHAR(191) NOT NULL,
    `priceGuest` INTEGER NOT NULL,
    `priceMember` INTEGER NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `flash_sale_items_flashSaleId_sortOrder_idx`(`flashSaleId`, `sortOrder`),
    INDEX `flash_sale_items_productSkuId_idx`(`productSkuId`),
    UNIQUE INDEX `flash_sale_items_flashSaleId_productSkuId_key`(`flashSaleId`, `productSkuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `flash_sale_items` ADD CONSTRAINT `flash_sale_items_flashSaleId_fkey` FOREIGN KEY (`flashSaleId`) REFERENCES `flash_sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flash_sale_items` ADD CONSTRAINT `flash_sale_items_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `product_skus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
