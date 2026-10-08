-- CreateTable
CREATE TABLE `promo_vouchers` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `label` VARCHAR(120) NULL,
    `type` ENUM('GENERAL', 'SPECIAL') NOT NULL,
    `discountType` ENUM('PERCENT', 'FIXED') NOT NULL,
    `discountValue` INTEGER NOT NULL,
    `maxDiscount` INTEGER NOT NULL DEFAULT 0,
    `minOrderAmount` INTEGER NOT NULL DEFAULT 0,
    `stock` INTEGER NOT NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `perUserLimit` INTEGER NOT NULL DEFAULT 0,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `promo_vouchers_code_key`(`code`),
    INDEX `promo_vouchers_isEnabled_startsAt_endsAt_idx`(`isEnabled`, `startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promo_voucher_redemptions` (
    `id` VARCHAR(191) NOT NULL,
    `voucherId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NULL,
    `guestKey` VARCHAR(64) NULL,
    `discountAmount` INTEGER NOT NULL,
    `status` ENUM('RESERVED', 'CONFIRMED', 'RELEASED') NOT NULL DEFAULT 'RESERVED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `confirmedAt` DATETIME(3) NULL,
    `releasedAt` DATETIME(3) NULL,

    UNIQUE INDEX `promo_voucher_redemptions_orderId_key`(`orderId`),
    INDEX `promo_voucher_redemptions_voucherId_status_idx`(`voucherId`, `status`),
    INDEX `promo_voucher_redemptions_memberId_voucherId_idx`(`memberId`, `voucherId`),
    INDEX `promo_voucher_redemptions_guestKey_voucherId_idx`(`guestKey`, `voucherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `orders`
    ADD COLUMN `itemSubtotalSnapshot` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `voucherCodeSnapshot` VARCHAR(40) NULL,
    ADD COLUMN `voucherDiscountSnapshot` INTEGER NOT NULL DEFAULT 0;

-- Backfill existing orders
UPDATE `orders`
SET `itemSubtotalSnapshot` = `priceSnapshot`
WHERE `itemSubtotalSnapshot` = 0;

-- AddForeignKey
ALTER TABLE `promo_voucher_redemptions` ADD CONSTRAINT `promo_voucher_redemptions_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `promo_vouchers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promo_voucher_redemptions` ADD CONSTRAINT `promo_voucher_redemptions_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promo_voucher_redemptions` ADD CONSTRAINT `promo_voucher_redemptions_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
