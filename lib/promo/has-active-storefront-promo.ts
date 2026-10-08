import { getAllActiveFlashSaleBundles } from "@/lib/promo/get-active-flash-sales";
import { getPublicPromoVouchers } from "@/lib/promo/get-public-promo-vouchers";

/** Ada promo publik yang layak ditampilkan (voucher global atau flash sale aktif). */
export async function hasActiveStorefrontPromo(now = new Date()): Promise<boolean> {
  const [vouchers, flashSales] = await Promise.all([
    getPublicPromoVouchers(now),
    getAllActiveFlashSaleBundles(now),
  ]);

  return vouchers.length > 0 || flashSales.length > 0;
}
