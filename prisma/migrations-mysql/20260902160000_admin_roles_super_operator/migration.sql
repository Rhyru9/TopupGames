-- Expand enum, migrate ADMIN → SUPER, then drop ADMIN
ALTER TABLE `admins` MODIFY `role` ENUM('ADMIN', 'SUPER', 'OPERATOR') NOT NULL DEFAULT 'ADMIN';

UPDATE `admins` SET `role` = 'SUPER' WHERE `role` = 'ADMIN';

ALTER TABLE `admins` MODIFY `role` ENUM('SUPER', 'OPERATOR') NOT NULL DEFAULT 'SUPER';
