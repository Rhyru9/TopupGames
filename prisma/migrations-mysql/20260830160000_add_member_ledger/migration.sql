-- CreateEnum
CREATE TABLE `member_ledger_entries` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `kind` ENUM('SALDO', 'POIN') NOT NULL,
    `direction` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `amount` INTEGER NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `createdByAdminId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `member_ledger_entries_memberId_createdAt_idx`(`memberId`, `createdAt`),
    INDEX `member_ledger_entries_kind_createdAt_idx`(`kind`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `member_ledger_entries`
  ADD CONSTRAINT `member_ledger_entries_memberId_fkey`
  FOREIGN KEY (`memberId`) REFERENCES `members`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
