-- CreateTable
CREATE TABLE `order_wallets` (
    `orderId` VARCHAR(191) NOT NULL,
    `poinUsed` INTEGER NOT NULL DEFAULT 0,
    `saldoUsed` INTEGER NOT NULL DEFAULT 0,
    `walletDebitedAt` DATETIME(3) NULL,
    `walletRefundedAt` DATETIME(3) NULL,
    `cashbackPoinSnapshot` INTEGER NOT NULL DEFAULT 0,
    `cashbackCreditedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`orderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate data from orders
INSERT INTO `order_wallets` (
  `orderId`,
  `poinUsed`,
  `saldoUsed`,
  `walletDebitedAt`,
  `walletRefundedAt`,
  `cashbackPoinSnapshot`,
  `cashbackCreditedAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  `id`,
  `poinUsed`,
  `saldoUsed`,
  `walletDebitedAt`,
  `walletRefundedAt`,
  `cashbackPoinSnapshot`,
  `cashbackCreditedAt`,
  `createdAt`,
  `updatedAt`
FROM `orders`;

-- AddForeignKey
ALTER TABLE `order_wallets` ADD CONSTRAINT `order_wallets_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop columns from orders
ALTER TABLE `orders`
  DROP COLUMN `poinUsed`,
  DROP COLUMN `saldoUsed`,
  DROP COLUMN `walletDebitedAt`,
  DROP COLUMN `walletRefundedAt`,
  DROP COLUMN `cashbackPoinSnapshot`,
  DROP COLUMN `cashbackCreditedAt`;
