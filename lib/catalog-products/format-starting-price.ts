/** Format harga mulai untuk badge kartu (contoh: 12 RB+ / 1,2 JT+). */
export function formatStartingPrice(price: number): string | null {
  if (!Number.isFinite(price) || price <= 0) return null;

  const n = Math.floor(price);

  if (n < 1000) {
    return `${n}`;
  }

  if (n < 1_000_000) {
    const ribu = n / 1000;
    const label =
      ribu >= 100 || Number.isInteger(ribu)
        ? String(Math.floor(ribu))
        : ribu.toFixed(1).replace(".", ",");
    return `${label} RB+`;
  }

  const juta = n / 1_000_000;
  const label =
    juta >= 100 || Number.isInteger(juta)
      ? String(Math.floor(juta))
      : juta.toFixed(1).replace(".", ",");
  return `${label} JT+`;
}
