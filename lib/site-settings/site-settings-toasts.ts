export const siteSettingsToasts = {
  generalUpdated: "Pengaturan umum berhasil disimpan.",
  seoUpdated: "Pengaturan SEO berhasil disimpan.",
  styleUpdated: "Pengaturan style berhasil disimpan.",
  pwaUpdated: "Pengaturan PWA berhasil disimpan.",
  authUpdated: "Pengaturan autentikasi berhasil disimpan.",
  mailUpdated: "Pengaturan email berhasil disimpan.",
  storageUpdated: "Pengaturan penyimpanan berhasil disimpan.",
  cronSecretGenerated: "Cron secret berhasil dibuat. Salin ulang baris crontab di panel hosting.",
  cronSecretRotated: "Cron secret diganti. Update crontab di VPS/cPanel dengan secret baru.",
  mailTestSent: "Email test berhasil terkirim.",
} as const;
