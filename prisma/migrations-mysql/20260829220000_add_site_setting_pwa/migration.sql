-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `pwa` JSON NOT NULL DEFAULT (JSON_OBJECT());
