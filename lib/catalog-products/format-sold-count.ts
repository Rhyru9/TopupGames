/** Format angka terjual manual untuk badge kartu. `0` → sembunyikan. */
export function formatSoldCount(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;

  const n = Math.floor(count);

  if (n < 1000) {
    return `${n}+ Terjual`;
  }

  if (n < 1_000_000) {
    const ribu = n / 1000;
    const label =
      ribu >= 100 || Number.isInteger(ribu)
        ? String(Math.floor(ribu))
        : ribu.toFixed(1).replace(".", ",");
    return `${label} RB+ Terjual`;
  }

  const juta = n / 1_000_000;
  const label =
    juta >= 100 || Number.isInteger(juta)
      ? String(Math.floor(juta))
      : juta.toFixed(1).replace(".", ",");
  return `${label} JT+ Terjual`;
}
