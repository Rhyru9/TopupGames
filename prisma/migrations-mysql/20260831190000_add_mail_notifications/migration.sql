-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `mail` JSON NOT NULL DEFAULT ('{}');

-- CreateTable
CREATE TABLE `member_email_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `type` ENUM('VERIFY', 'RESET_PASSWORD') NOT NULL,
    `tokenHash` VARCHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `member_email_tokens_tokenHash_key`(`tokenHash`),
    INDEX `member_email_tokens_memberId_type_idx`(`memberId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_logs` (
    `id` VARCHAR(191) NOT NULL,
    `templateKey` VARCHAR(40) NOT NULL,
    `entityType` VARCHAR(20) NOT NULL,
    `entityId` VARCHAR(40) NOT NULL,
    `recipient` VARCHAR(190) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email_logs_templateKey_entityType_entityId_key`(`templateKey`, `entityType`, `entityId`),
    INDEX `email_logs_sentAt_idx`(`sentAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `member_email_tokens` ADD CONSTRAINT `member_email_tokens_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
