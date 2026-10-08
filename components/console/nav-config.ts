export type ConsoleNavIconName =
  | "dashboard"
  | "games"
  | "categories"
  | "products"
  | "orders"
  | "deposits"
  | "banners"
  | "ticker"
  | "bell"
  | "news"
  | "members"
  | "website"
  | "payment"
  | "providers"
  | "vouchers"
  | "flash"
  | "whitelist"
  | "reports"
  | "income"
  | "expense"
  | "admins"
  | "seo";

export type ConsoleNavItem = {
  href: string;
  label: string;
  icon: ConsoleNavIconName;
  /** Referensi route — belum diimplementasi */
  disabled?: boolean;
};

export type ConsoleNavGroup = {
  title: string;
  items: ConsoleNavItem[];
};

/** Menu referensi admin — diselaraskan dengan proyek lama, grouping r9host-topup. */
export const consoleNavGroups: ConsoleNavGroup[] = [
  {
    title: "Utama",
    items: [{ href: "/console", label: "Dashboard", icon: "dashboard" }],
  },
  {
    title: "Produk",
    items: [
      { href: "/console/categories", label: "Kategori", icon: "categories" },
      { href: "/console/produk", label: "Produk", icon: "games" },
      { href: "/console/jenis-produk", label: "Jenis Produk", icon: "categories" },
      { href: "/console/product-skus", label: "SKU Produk", icon: "products" },
    ],
  },
  {
    title: "Transaksi",
    items: [
      { href: "/console/orders", label: "Pesanan", icon: "orders" },
      { href: "/console/order-payments", label: "Pembayaran Pesanan", icon: "payment" },
      { href: "/console/deposits", label: "Deposit Member", icon: "deposits" },
    ],
  },
  {
    title: "Promo",
    items: [
      { href: "/console/promo/flash-sale", label: "Flash Sale", icon: "flash" },
      { href: "/console/promo/voucher-promo", label: "Voucher Promo", icon: "vouchers" },
    ],
  },
  {
    title: "Laporan",
    items: [
      { href: "/console/laporan", label: "Ringkasan", icon: "reports" },
      { href: "/console/laporan/pemasukan", label: "Pemasukan", icon: "income" },
      { href: "/console/laporan/pengeluaran", label: "Pengeluaran", icon: "expense" },
    ],
  },
  {
    title: "Konten",
    items: [
      { href: "/console/banners", label: "Banner", icon: "banners" },
      { href: "/console/ticker", label: "Teks Berjalan", icon: "ticker" },
      { href: "/console/halaman", label: "Halaman", icon: "news" },
      { href: "/console/artikel", label: "Artikel", icon: "news" },
      { href: "/console/popup", label: "Popup", icon: "bell" },
    ],
  },
  {
    title: "Member",
    items: [
      { href: "/console/members", label: "Member", icon: "members" },
      { href: "/console/members/balances", label: "Saldo & Poin", icon: "deposits" },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { href: "/console/settings/admins", label: "Admin", icon: "admins" },
      { href: "/console/settings/providers", label: "Provider", icon: "providers" },
      { href: "/console/settings/website", label: "Website", icon: "website" },
      { href: "/console/settings/seo", label: "SEO", icon: "seo" },
      { href: "/console/settings/payment", label: "Payment Gateway", icon: "payment" },
    ],
  },
];
