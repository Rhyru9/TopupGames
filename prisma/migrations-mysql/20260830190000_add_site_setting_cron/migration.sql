-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `cron` JSON NOT NULL DEFAULT (JSON_OBJECT());
