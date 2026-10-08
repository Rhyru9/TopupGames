-- AlterTable
ALTER TABLE `members`
  ADD COLUMN `status` ENUM('ACTIVE', 'SUSPENDED', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN `statusReason` VARCHAR(500) NULL,
  ADD COLUMN `statusAt` DATETIME(3) NULL;

-- Backfill nonaktif lama → SUSPENDED
UPDATE `members`
SET `status` = 'SUSPENDED',
    `statusAt` = CURRENT_TIMESTAMP(3)
WHERE `isActive` = false;

-- CreateIndex
CREATE INDEX `members_status_idx` ON `members`(`status`);
