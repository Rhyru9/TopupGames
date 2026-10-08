-- AlterTable
ALTER TABLE `orders`
  ADD COLUMN `providerRefId` VARCHAR(80) NULL,
  ADD COLUMN `fulfillmentAttemptedAt` DATETIME(3) NULL,
  ADD COLUMN `fulfillmentCompletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `orders_fulfillmentStatus_paymentStatus_idx` ON `orders`(`fulfillmentStatus`, `paymentStatus`);

-- CreateIndex
CREATE INDEX `orders_providerRefId_idx` ON `orders`(`providerRefId`);

-- CreateTable
CREATE TABLE `fulfillment_logs` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `providerSlug` VARCHAR(40) NOT NULL,
    `attempt` INTEGER NOT NULL DEFAULT 1,
    `providerRef` VARCHAR(80) NULL,
    `action` ENUM('CREATE', 'POLL', 'WEBHOOK', 'RETRY') NOT NULL,
    `requestPayload` JSON NULL,
    `responsePayload` JSON NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL,
    `message` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fulfillment_logs_orderId_createdAt_idx`(`orderId`, `createdAt`),
    INDEX `fulfillment_logs_providerRef_idx`(`providerRef`),
    INDEX `fulfillment_logs_providerSlug_createdAt_idx`(`providerSlug`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fulfillment_logs` ADD CONSTRAINT `fulfillment_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
