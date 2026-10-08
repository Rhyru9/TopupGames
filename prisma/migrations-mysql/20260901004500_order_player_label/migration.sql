-- AlterTable: add playerLabel, backfill, drop playerUserId/playerZone
ALTER TABLE `orders` ADD COLUMN `playerLabel` VARCHAR(255) NULL;

UPDATE `orders`
SET `playerLabel` = NULLIF(
  TRIM(
    BOTH ' | ' FROM CONCAT_WS(
      ' | ',
      NULLIF(TRIM(`playerUserId`), ''),
      NULLIF(TRIM(`playerZone`), '')
    )
  ),
  ''
)
WHERE `playerLabel` IS NULL
  AND (
    (TRIM(COALESCE(`playerUserId`, '')) <> '')
    OR (TRIM(COALESCE(`playerZone`, '')) <> '')
  );

ALTER TABLE `orders` DROP COLUMN `playerUserId`,
  DROP COLUMN `playerZone`;

CREATE INDEX `orders_playerLabel_idx` ON `orders`(`playerLabel`);
