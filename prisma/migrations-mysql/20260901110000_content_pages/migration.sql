CREATE TABLE `content_pages` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `showInFooter` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `content_pages_slug_key`(`slug`),
    INDEX `content_pages_isActive_showInFooter_sortOrder_idx`(`isActive`, `showInFooter`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `content_pages` (`id`, `slug`, `title`, `content`, `sortOrder`, `isActive`, `showInFooter`, `createdAt`, `updatedAt`)
VALUES
(
    'default_privacy_policy',
    'kebijakan-privasi',
    'Kebijakan Privasi',
    '<p>Halaman ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi pengguna layanan top up game.</p><h2>Data yang dikumpulkan</h2><p>Kami dapat memproses email, identitas game, dan informasi transaksi yang Anda berikan saat melakukan pemesanan.</p><h2>Penggunaan data</h2><p>Data digunakan untuk memproses pesanan, verifikasi pembayaran, dukungan pelanggan, dan peningkatan layanan.</p>',
    0,
    true,
    true,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
),
(
    'default_terms_of_service',
    'ketentuan-layanan',
    'Ketentuan Layanan',
    '<p>Dengan menggunakan layanan ini, Anda setuju untuk mematuhi ketentuan berikut.</p><h2>Layanan</h2><p>Kami menyediakan layanan top up game digital. Waktu proses bergantung pada antrian dan provider game.</p><h2>Pembayaran</h2><p>Pastikan data akun game dan nominal pesanan sudah benar sebelum checkout. Pesanan yang sudah diproses tidak dapat dibatalkan.</p>',
    1,
    true,
    true,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
);
