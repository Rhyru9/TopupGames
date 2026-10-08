-- Baseline skema r9host-topup (final, production-ready)
-- Squash: tanpa kolom products.brand; IAK apiUrl = prepaid.iak.id

-- CreateTable
CREATE TABLE `fulfillment_providers` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `docsUrl` VARCHAR(500) NULL,
    `config` JSON NULL,
    `sandboxMode` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `supportsCatalogSync` BOOLEAN NOT NULL DEFAULT false,
    `balanceAmount` INTEGER NULL,
    `balanceCurrency` VARCHAR(10) NULL,
    `balanceLabel` VARCHAR(80) NULL,
    `balanceSyncedAt` DATETIME(3) NULL,
    `balanceSyncError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fulfillment_providers_slug_key`(`slug`),
    INDEX `fulfillment_providers_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(500) NULL,
    `role` ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `iconUrl` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NOT NULL DEFAULT '',
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'HIDDEN') NOT NULL DEFAULT 'ACTIVE',
    `thumbnailUrl` VARCHAR(500) NOT NULL,
    `bannerUrl` VARCHAR(500) NOT NULL DEFAULT '',
    `requiresZone` BOOLEAN NOT NULL DEFAULT false,
    `nicknameCheckCode` VARCHAR(191) NULL,
    `guideHtml` TEXT NULL,
    `fieldHintHtml` TEXT NULL,
    `inputFields` JSON NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    INDEX `products_status_sortOrder_idx`(`status`, `sortOrder`),
    INDEX `products_isPopular_status_sortOrder_idx`(`isPopular`, `status`, `sortOrder`),
    INDEX `products_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_types` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `iconUrl` VARCHAR(500) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_types_productId_sortOrder_idx`(`productId`, `sortOrder`),
    UNIQUE INDEX `product_types_productId_slug_key`(`productId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_skus` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productTypeId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `providerSku` VARCHAR(191) NOT NULL,
    `providerTypeKey` VARCHAR(120) NULL,
    `providerProductName` VARCHAR(500) NULL,
    `keepCustomName` BOOLEAN NOT NULL DEFAULT false,
    `costPrice` INTEGER NOT NULL,
    `marginGuest` INTEGER NOT NULL DEFAULT 0,
    `marginMember` INTEGER NOT NULL DEFAULT 0,
    `priceGuest` INTEGER NOT NULL,
    `priceMember` INTEGER NOT NULL,
    `status` ENUM('AVAILABLE', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_skus_productId_status_costPrice_idx`(`productId`, `status`, `costPrice`),
    INDEX `product_skus_productId_productTypeId_costPrice_idx`(`productId`, `productTypeId`, `costPrice`),
    INDEX `product_skus_providerId_idx`(`providerId`),
    INDEX `product_skus_providerSku_idx`(`providerSku`),
    UNIQUE INDEX `product_skus_productId_providerId_providerSku_key`(`productId`, `providerId`, `providerSku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_providers` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `filters` JSON NOT NULL DEFAULT ('{}'),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_providers_productId_idx`(`productId`),
    UNIQUE INDEX `product_providers_productId_providerId_key`(`productId`, `providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `general` JSON NOT NULL,
    `seo` JSON NOT NULL,
    `storage` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_types` ADD CONSTRAINT `product_types_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_skus` ADD CONSTRAINT `product_skus_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_skus` ADD CONSTRAINT `product_skus_productTypeId_fkey` FOREIGN KEY (`productTypeId`) REFERENCES `product_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_skus` ADD CONSTRAINT `product_skus_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `fulfillment_providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_providers` ADD CONSTRAINT `product_providers_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_providers` ADD CONSTRAINT `product_providers_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `fulfillment_providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: fulfillment providers
INSERT INTO `fulfillment_providers` (`id`, `slug`, `name`, `description`, `docsUrl`, `config`, `sortOrder`, `isActive`, `supportsCatalogSync`, `updatedAt`) VALUES
('fp_digiflazz', 'digiflazz', 'Digiflazz', NULL, 'https://developer.digiflazz.com/api/buyer/topup/', JSON_OBJECT('apiUrl', 'https://api.digiflazz.com/v1/transaction'), 1, true, true, CURRENT_TIMESTAMP(3)),
('fp_melostore', 'melostore', 'Melostore H2H', 'H2H katalog lebar (game, voucher global, streaming). Auth: X-API-Key + X-Secret-Key. Webhook async: X-H2H-Signature (HMAC-SHA256, Webhook Secret terpisah). Production wajib IP whitelist.', 'https://h2h.melostore.id/id/docs', JSON_OBJECT('apiUrl', 'https://api.melostore.id/api/v1/h2h'), 2, true, true, CURRENT_TIMESTAMP(3)),
('fp_apigames', 'apigames', 'API Games', NULL, 'https://docs.apigames.id', JSON_OBJECT('apiUrl', 'https://v1.apigames.id'), 3, true, false, CURRENT_TIMESTAMP(3)),
('fp_iak', 'iak', 'IAK', NULL, 'https://api.iak.id/developer/integration/quick-start', JSON_OBJECT('apiUrl', 'https://prepaid.iak.id/api/top-up'), 4, true, true, CURRENT_TIMESTAMP(3)),
('fp_manual', 'manual', 'Manual', NULL, NULL, JSON_OBJECT(), 5, true, false, CURRENT_TIMESTAMP(3));

-- Seed: kategori storefront
INSERT INTO `categories` (`id`, `slug`, `name`, `sortOrder`, `isActive`, `updatedAt`) VALUES
('cat_game', 'game', 'Topup Game', 1, true, CURRENT_TIMESTAMP(3)),
('cat_app', 'app', 'App Premium', 2, true, CURRENT_TIMESTAMP(3)),
('cat_pulsa', 'pulsa', 'Pulsa & Data', 3, true, CURRENT_TIMESTAMP(3)),
('cat_voucher', 'voucher', 'Voucher', 4, true, CURRENT_TIMESTAMP(3)),
('cat_emoney', 'e-money', 'E-Money', 5, true, CURRENT_TIMESTAMP(3));

-- Seed: site settings default row
INSERT INTO `site_settings` (`id`, `general`, `seo`, `storage`, `updatedAt`) VALUES (
    'default',
    JSON_OBJECT(
        'siteName', 'R9host',
        'siteUrl', '',
        'logoHeaderUrl', '',
        'logoFooterUrl', '',
        'faviconUrl', '/pavicon.ico',
        'whatsappUrl', '',
        'instagramUrl', '',
        'tiktokUrl', '',
        'youtubeUrl', '',
        'facebookUrl', '',
        'email', ''
    ),
    JSON_OBJECT(
        'metaTitle', 'R9host — Top Up Game Instant',
        'metaKeywords', 'top up game, mobile legends, free fire, R9host',
        'metaDescription', 'Top up Mobile Legends, Free Fire, dan ratusan game. Cepat, aman, harga final.',
        'ogImageUrl', ''
    ),
    JSON_OBJECT(
        'driver', 'local',
        'local', JSON_OBJECT('uploadDir', '', 'publicUrlPrefix', '/uploads'),
        'cloudflareR2', JSON_OBJECT(
            'accountId', '',
            'accessKeyId', '',
            'secretAccessKey', '',
            'bucket', '',
            'publicBaseUrl', '',
            'endpoint', ''
        )
    ),
    CURRENT_TIMESTAMP(3)
);
