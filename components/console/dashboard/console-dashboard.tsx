import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  formatDashboardIdr,
  formatDashboardNumber,
  getConsoleDashboard,
} from "@/lib/dashboard/get-console-dashboard";
import { ConsoleOrderChart } from "./console-order-chart";
import { DashboardRecentOrdersSection } from "./dashboard-recent-orders";

export async function ConsoleDashboard() {
  const session = await auth();
  const adminName = session?.user?.name ?? "Admin";
  const data = await getConsoleDashboard();
  const { summary, ordersAllTime, chart12Months, year, recentOrders } = data;

  const topWidgets = [
    {
      key: "users",
      href: "/console/members",
      label: "Total Users",
      value: formatDashboardNumber(summary.totalUsers),
      hint: "Member terdaftar",
      tone: "cyan" as const,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c0-2.2 2.7-4 6-4s6 1.8 6 4" strokeLinecap="round" />
          <path d="M16 8.5a2.5 2.5 0 1 1 0 5M19 19c0-1.5-1.5-2.8-3.5-3.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "products",
      href: "/console/produk",
      label: "Total Produk",
      value: formatDashboardNumber(summary.totalProducts),
      hint: "Produk di katalog",
      tone: "violet" as const,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="4" y="4" width="16" height="6" rx="1.5" />
          <rect x="4" y="14" width="16" height="6" rx="1.5" />
        </svg>
      ),
    },
    {
      key: "skus",
      href: "/console/product-skus",
      label: "Total Layanan",
      value: formatDashboardNumber(summary.totalProductSkus),
      hint: "SKU produk katalog",
      tone: "rose" as const,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" strokeLinecap="round" />
          <rect x="3" y="6" width="18" height="12" rx="3" />
        </svg>
      ),
    },
    {
      key: "profit",
      href: "/console/laporan",
      label: "Total Pendapatan",
      value: formatDashboardIdr(summary.netProfitYear),
      hint: `Profit bersih ${year}`,
      tone: "neon" as const,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 3v18M8 7h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  const orderSummaries = [
    {
      key: "success",
      href: "/console/orders?fulfillmentStatus=SUCCESS",
      label: "Order Success",
      amount: ordersAllTime.success.amount,
      count: ordersAllTime.success.count,
      tone: "success" as const,
      badgeUnit: "pesanan",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M6 6h15l-1.5 9H7.5L6 6z" strokeLinejoin="round" />
          <path d="M6 6 5 3H2M9 20a1 1 0 1 0 0 .01M18 20a1 1 0 1 0 0 .01" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "pending",
      href: "/console/orders",
      label: "Order Pending",
      amount: ordersAllTime.pending.amount,
      count: ordersAllTime.pending.count,
      tone: "pending" as const,
      badgeUnit: "pesanan",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: "failed",
      href: "/console/orders?fulfillmentStatus=FAILED",
      label: "Order Gagal",
      amount: ordersAllTime.failed.amount,
      count: ordersAllTime.failed.count,
      tone: "failed" as const,
      badgeUnit: "pesanan",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
          <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "topup",
      href: "/console/deposits",
      label: "Total Topup",
      amount: ordersAllTime.topup.amount,
      count: ordersAllTime.topup.count,
      tone: "topup" as const,
      badgeUnit: "deposit",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 3v18M8 7h8a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="console-page">
      <div className="console-page-intro">
        <p className="console-page-intro__eyebrow">Dashboard</p>
        <h2 className="console-page-intro__title">
          Halo, <span className="console-page-intro__accent">{adminName}</span>
        </h2>
        <p className="console-page-intro__text">
          Ringkasan operasional toko top-up dari data real-time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topWidgets.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`console-widget console-widget--link console-widget--${item.tone}`}
          >
            <div className={`console-widget__icon console-widget__icon--${item.tone}`}>{item.icon}</div>
            <div className="console-widget__body">
              <p className="console-widget__label">{item.label}</p>
              <p className="console-widget__value">{item.value}</p>
              <p className="console-widget__hint">{item.hint}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="console-panel console-panel--flush">
        <div className="console-dashboard-grid">
          <div className="console-dashboard-grid__side">
            {orderSummaries.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`console-order-card console-order-card--link console-order-card--${item.tone}`}
              >
                <div className="console-order-card__head">
                  <span className={`console-order-card__icon console-order-card__icon--${item.tone}`}>
                    {item.icon}
                  </span>
                  <span className="console-order-card__label">{item.label}</span>
                </div>
                <div className="console-order-card__foot">
                  <p className="console-order-card__amount">{formatDashboardIdr(item.amount)}</p>
                  <span className={`console-order-card__badge console-order-card__badge--${item.tone}`}>
                    {formatDashboardNumber(item.count)} {item.badgeUnit}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="console-dashboard-grid__chart">
            <div className="console-panel__head">
              <h2 className="console-panel__title">Grafik Pesanan</h2>
              <p className="console-panel__subtitle">12 bulan terakhir · sukses vs gagal</p>
            </div>
            <ConsoleOrderChart
              labels={chart12Months.labels}
              success={chart12Months.success}
              failed={chart12Months.failed}
              totalSuccess={chart12Months.totalSuccess}
              totalFailed={chart12Months.totalFailed}
            />
          </div>
        </div>
      </div>

      <DashboardRecentOrdersSection orders={recentOrders} />
    </div>
  );
}
