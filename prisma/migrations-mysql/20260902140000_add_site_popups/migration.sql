-- CreateTable
CREATE TABLE `site_popups` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `mode` ENUM('IMAGE', 'TEXT') NOT NULL DEFAULT 'IMAGE',
    `body` TEXT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `ctaLabel` VARCHAR(80) NOT NULL DEFAULT '',
    `ctaHref` VARCHAR(500) NOT NULL DEFAULT '',
    `dismissMinutes` INTEGER NOT NULL DEFAULT 5,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `site_popups_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
