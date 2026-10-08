-- CreateTable
CREATE TABLE `product_sku_provider_maps` (
    `id` VARCHAR(191) NOT NULL,
    `productSkuId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `providerSku` VARCHAR(120) NOT NULL,
    `costPrice` INTEGER NOT NULL DEFAULT 0,
    `priority` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `psp_maps_sku_active_priority_idx`(`productSkuId`, `isActive`, `priority`),
    INDEX `psp_maps_providerId_idx`(`providerId`),
    UNIQUE INDEX `psp_maps_sku_provider_sku_key`(`productSkuId`, `providerId`, `providerSku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_sku_provider_maps` ADD CONSTRAINT `psp_maps_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `product_skus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_sku_provider_maps` ADD CONSTRAINT `psp_maps_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `fulfillment_providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
