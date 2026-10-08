-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `style` JSON NOT NULL DEFAULT (JSON_OBJECT());
