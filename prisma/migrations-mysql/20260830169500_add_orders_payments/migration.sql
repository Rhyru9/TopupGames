-- CreateEnum (MySQL inline)
-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderCode` VARCHAR(32) NOT NULL,
    `memberId` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productSkuId` VARCHAR(191) NOT NULL,
    `productNameSnapshot` VARCHAR(200) NOT NULL,
    `skuNameSnapshot` VARCHAR(200) NOT NULL,
    `priceSnapshot` INTEGER NOT NULL,
    `feeSnapshot` INTEGER NOT NULL DEFAULT 0,
    `amount` INTEGER NOT NULL,
    `playerUserId` VARCHAR(120) NULL,
    `playerZone` VARCHAR(80) NULL,
    `playerNickname` VARCHAR(120) NULL,
    `playerFields` JSON NULL,
    `email` VARCHAR(190) NULL,
    `whatsapp` VARCHAR(20) NULL,
    `paymentStatus` ENUM('UNPAID', 'PAID', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'UNPAID',
    `fulfillmentStatus` ENUM('NONE', 'QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'NONE',
    `providerSlug` VARCHAR(40) NULL,
    `providerSkuSnapshot` VARCHAR(120) NULL,
    `fulfillmentMessage` TEXT NULL,
    `fulfillmentSn` VARCHAR(255) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_orderCode_key`(`orderCode`),
    INDEX `orders_email_idx`(`email`),
    INDEX `orders_whatsapp_idx`(`whatsapp`),
    INDEX `orders_paymentStatus_createdAt_idx`(`paymentStatus`, `createdAt`),
    INDEX `orders_memberId_createdAt_idx`(`memberId`, `createdAt`),
    INDEX `orders_productId_idx`(`productId`),
    INDEX `orders_productSkuId_idx`(`productSkuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(40) NOT NULL,
    `channel` VARCHAR(40) NOT NULL,
    `channelName` VARCHAR(120) NULL,
    `reference` VARCHAR(80) NOT NULL,
    `amount` INTEGER NOT NULL,
    `checkoutUrl` VARCHAR(500) NULL,
    `payCode` VARCHAR(120) NULL,
    `qrUrl` VARCHAR(500) NULL,
    `status` ENUM('UNPAID', 'PAID', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'UNPAID',
    `expiredAt` DATETIME(3) NULL,
    `rawCreateResponse` JSON NULL,
    `rawCallback` JSON NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_reference_key`(`reference`),
    INDEX `payments_orderId_idx`(`orderId`),
    INDEX `payments_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_productSkuId_fkey` FOREIGN KEY (`productSkuId`) REFERENCES `product_skus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
