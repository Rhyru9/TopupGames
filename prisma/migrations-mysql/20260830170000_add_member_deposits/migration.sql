-- CreateTable
CREATE TABLE `member_deposits` (
    `id` VARCHAR(191) NOT NULL,
    `depositCode` VARCHAR(32) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `feeSnapshot` INTEGER NOT NULL DEFAULT 0,
    `totalAmount` INTEGER NOT NULL,
    `paymentStatus` ENUM('UNPAID', 'PAID', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'UNPAID',
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `member_deposits_depositCode_key`(`depositCode`),
    INDEX `member_deposits_memberId_createdAt_idx`(`memberId`, `createdAt`),
    INDEX `member_deposits_paymentStatus_createdAt_idx`(`paymentStatus`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `payments` MODIFY `orderId` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD COLUMN `memberDepositId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `payments_memberDepositId_idx` ON `payments`(`memberDepositId`);

-- AddForeignKey
ALTER TABLE `member_deposits` ADD CONSTRAINT `member_deposits_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_memberDepositId_fkey` FOREIGN KEY (`memberDepositId`) REFERENCES `member_deposits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
