-- AlterTable
ALTER TABLE `categories` ADD COLUMN `defaultRequiresLogin` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `requiresLogin` BOOLEAN NOT NULL DEFAULT false;
