-- CreateTable
CREATE TABLE `members` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `whatsapp` VARCHAR(20) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `image` VARCHAR(500) NULL,
    `googleId` VARCHAR(120) NULL,
    `emailVerified` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `members_email_key`(`email`),
    UNIQUE INDEX `members_whatsapp_key`(`whatsapp`),
    UNIQUE INDEX `members_googleId_key`(`googleId`),
    INDEX `members_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `auth` JSON NOT NULL DEFAULT (JSON_OBJECT());
