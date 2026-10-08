-- AlterTable
ALTER TABLE `product_skus` ADD COLUMN `cashbackPoin` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `cashbackPoinSnapshot` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `cashbackCreditedAt` DATETIME(3) NULL;
