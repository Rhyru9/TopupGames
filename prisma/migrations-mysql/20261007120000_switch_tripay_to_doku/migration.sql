-- Ganti seed gateway Tripay → DOKU (kredensial lama tidak kompatibel, dikosongkan)
UPDATE `payment_gateways`
SET
  `id` = 'pg_doku',
  `slug` = 'doku',
  `name` = 'DOKU',
  `description` = 'DOKU Checkout: QRIS, e-wallet, VA, minimarket, kartu, paylater.',
  `docsUrl` = 'https://jokul.doku.com',
  `config` = JSON_OBJECT(),
  `sandboxMode` = true,
  `isActive` = false,
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `slug` = 'tripay';

INSERT INTO `payment_gateways` (`id`, `slug`, `name`, `description`, `docsUrl`, `config`, `sandboxMode`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
SELECT
  'pg_doku',
  'doku',
  'DOKU',
  'DOKU Checkout: QRIS, e-wallet, VA, minimarket, kartu, paylater.',
  'https://jokul.doku.com',
  JSON_OBJECT(),
  true,
  0,
  false,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `payment_gateways` WHERE `slug` = 'doku');
