export const flashSaleToasts = {
  created: "Flash sale berhasil dibuat.",
  updated: "Flash sale berhasil diperbarui.",
  deleted: "Flash sale berhasil dihapus.",
  statusUpdated: "Status flash sale berhasil diperbarui.",
  createBlocked:
    "Tidak bisa menambah flash sale baru. Masih ada campaign yang sedang berjalan.",
} as const;

export function flashSaleCreateBlockedToast(runningName: string) {
  return `Tidak bisa menambah flash sale baru. Masih ada campaign berjalan: "${runningName}". Nonaktifkan atau tunggu selesai dulu.`;
}
