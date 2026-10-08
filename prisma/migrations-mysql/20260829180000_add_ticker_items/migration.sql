-- CreateTable
CREATE TABLE `ticker_items` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `detail` VARCHAR(160) NOT NULL,
    `href` VARCHAR(500) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ticker_items_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
