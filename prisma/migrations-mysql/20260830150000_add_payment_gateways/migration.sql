-- CreateTable
CREATE TABLE `payment_gateways` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `docsUrl` VARCHAR(500) NULL,
    `config` JSON NULL,
    `sandboxMode` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_gateways_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed Tripay (nonaktif sampai kredensial diisi)
INSERT INTO `payment_gateways` (`id`, `slug`, `name`, `description`, `docsUrl`, `config`, `sandboxMode`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (
  'pg_tripay',
  'tripay',
  'Tripay',
  'Closed payment: QRIS, e-wallet, VA, retail. Invoice per order.',
  'https://tripay.co.id/developer',
  JSON_OBJECT(),
  true,
  0,
  false,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
);
