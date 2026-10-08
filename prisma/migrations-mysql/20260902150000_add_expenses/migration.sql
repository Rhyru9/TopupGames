-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `category` ENUM('ADS', 'OPERATIONAL', 'INFRASTRUCTURE', 'SALARY', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `description` VARCHAR(500) NOT NULL,
    `amount` INTEGER NOT NULL,
    `receiptUrl` VARCHAR(500) NULL,
    `createdByAdminId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `expenses_date_idx`(`date`),
    INDEX `expenses_category_date_idx`(`category`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_createdByAdminId_fkey` FOREIGN KEY (`createdByAdminId`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
