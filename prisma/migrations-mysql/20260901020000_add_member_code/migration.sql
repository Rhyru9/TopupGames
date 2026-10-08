-- ID publik member: CUS + 8 digit
ALTER TABLE `members` ADD COLUMN `memberCode` VARCHAR(12) NULL;

UPDATE `members` m
INNER JOIN (
  SELECT
    `id`,
    CONCAT('CUS', LPAD(ROW_NUMBER() OVER (ORDER BY `createdAt` ASC, `id` ASC), 8, '0')) AS `code`
  FROM `members`
) t ON m.`id` = t.`id`
SET m.`memberCode` = t.`code`
WHERE m.`memberCode` IS NULL;

ALTER TABLE `members` MODIFY COLUMN `memberCode` VARCHAR(12) NOT NULL;
CREATE UNIQUE INDEX `members_memberCode_key` ON `members`(`memberCode`);
