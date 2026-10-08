import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { formatRupiah } from "@/lib/format-rupiah";
import { getMemberSession } from "@/lib/member-auth";
import {
  listMemberOrders,
  MEMBER_ORDERS_PAGE_SIZE,
} from "@/lib/orders/list-member-orders";
import { memberRiwayatStatus } from "@/lib/orders/order-status-labels";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Riwayat Transaksi — R9host",
};

const ALL_LIMIT = 200;

type MemberRiwayatPageProps = {
  searchParams: Promise<{ q?: string; page?: string; all?: string }>;
};

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildRiwayatHref(options: {
  q?: string;
  page?: number;
  all?: boolean;
}): string {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  if (options.all) {
    params.set("all", "1");
  } else if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }
  const qs = params.toString();
  return qs ? `/member/riwayat?${qs}` : "/member/riwayat";
}

export default async function MemberRiwayatPage({ searchParams }: MemberRiwayatPageProps) {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    redirect("/masuk?next=/member/riwayat");
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });

  if (!member) {
    redirect("/masuk?next=/member/riwayat");
  }

  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const showAll = sp.all === "1";
  const pageRaw = Number.parseInt(sp.page || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const { orders, total } = await listMemberOrders({
    memberId: session.user.id,
    q: q || undefined,
    skip: showAll ? 0 : (page - 1) * MEMBER_ORDERS_PAGE_SIZE,
    take: showAll ? ALL_LIMIT : MEMBER_ORDERS_PAGE_SIZE,
  });

  const pageCount = Math.max(1, Math.ceil(total / MEMBER_ORDERS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const needsPageFix = !showAll && safePage !== page;

  const pageOrders = needsPageFix
    ? (
        await listMemberOrders({
          memberId: session.user.id,
          q: q || undefined,
          skip: (safePage - 1) * MEMBER_ORDERS_PAGE_SIZE,
          take: MEMBER_ORDERS_PAGE_SIZE,
        })
      ).orders
    : orders;

  const hasMore = !showAll && total > MEMBER_ORDERS_PAGE_SIZE;
  const emptyBecauseSearch = total === 0 && Boolean(q);

  return (
    <StorefrontSiteFrame footer="compact" className="member-auth member-area member-area--docked member-area--profile">
      <Header
        homeHref="/"
        navPrefix="/"
        forceSolid
        memberName={member.name}
        memberImage={member.image}
      />
      <main className="member-area__main member-area__main--wide">
        <div className="member-area__shell">
          <div className="r9host-riwayat">
            <div className="r9host-riwayat__toolbar">
              <div>
                <p className="r9host-riwayat__eyebrow">Akun member</p>
                <h1 className="r9host-riwayat__title">Riwayat transaksi</h1>
              </div>
              <Link href="/member" className="r9host-riwayat__back">
                ← Kembali
              </Link>
            </div>

            <form className="r9host-riwayat__search" method="get" action="/member/riwayat">
              <label className="r9host-riwayat__search-field" htmlFor="riwayat-q">
                <span className="r9host-riwayat__search-label">Cari invoice</span>
                <input
                  id="riwayat-q"
                  name="q"
                  type="search"
                  defaultValue={q}
                  placeholder="R9xxxxxhxxxxxxxxxoxxxst"
                  autoComplete="off"
                  className="r9host-riwayat__search-input"
                />
              </label>
              <button type="submit" className="r9host-riwayat__search-btn">
                Cari
              </button>
              {q ? (
                <Link href="/member/riwayat" className="r9host-riwayat__search-clear">
                  Reset
                </Link>
              ) : null}
            </form>

            {total === 0 ? (
              <section className="r9host-riwayat__empty" aria-label="Belum ada transaksi">
                <h2 className="r9host-riwayat__empty-title">
                  {emptyBecauseSearch ? "Invoice tidak ditemukan" : "Belum ada transaksi"}
                </h2>
                <p className="r9host-riwayat__empty-text">
                  {emptyBecauseSearch
                    ? "Coba periksa nomor invoice, atau reset pencarian."
                    : "Pesanan yang kamu checkout saat login akan muncul di sini."}
                </p>
                {emptyBecauseSearch ? (
                  <Link href="/member/riwayat" className="r9host-riwayat__cta">
                    Reset pencarian
                  </Link>
                ) : (
                  <Link href="/produk" className="r9host-riwayat__cta">
                    Top up sekarang
                  </Link>
                )}
              </section>
            ) : (
              <>
                <p className="r9host-riwayat__count">
                  {showAll
                    ? `Menampilkan ${pageOrders.length} dari ${total} transaksi`
                    : `Halaman ${safePage} dari ${pageCount} · ${total} transaksi`}
                  {q ? ` · filter “${q}”` : ""}
                </p>

                <div className="r9host-riwayat__table" role="table" aria-label="Daftar transaksi">
                  <div className="r9host-riwayat__thead" role="row">
                    <span role="columnheader">Produk</span>
                    <span role="columnheader">Invoice</span>
                    <span role="columnheader">Tanggal</span>
                    <span role="columnheader">Metode</span>
                    <span role="columnheader">Status</span>
                    <span role="columnheader">Total</span>
                  </div>
                  <ul className="r9host-riwayat__list">
                    {pageOrders.map((order) => {
                      const status = memberRiwayatStatus(
                        order.paymentStatus,
                        order.fulfillmentStatus,
                      );
                      const initial =
                        order.productNameSnapshot.trim().charAt(0).toUpperCase() || "?";
                      return (
                        <li key={order.id} role="row">
                          <Link
                            href={`/invoice/${order.orderCode}`}
                            className={`r9host-riwayat__row r9host-riwayat__row--${status.tone}`}
                          >
                            <span className="r9host-riwayat__cell r9host-riwayat__cell--product">
                              <span className="r9host-riwayat__thumb" aria-hidden>
                                {order.thumbnailUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={order.thumbnailUrl}
                                    alt=""
                                    className="r9host-riwayat__thumb-img"
                                  />
                                ) : (
                                  <span className="r9host-riwayat__thumb-fallback">{initial}</span>
                                )}
                              </span>
                              <span className="r9host-riwayat__product-text">
                                <span className="r9host-riwayat__product">
                                  {order.productNameSnapshot}
                                </span>
                                <span className="r9host-riwayat__sku">{order.skuNameSnapshot}</span>
                                <span className="r9host-riwayat__mobile-meta">
                                  {formatOrderDate(order.createdAt)}
                                  {order.channel ? ` · ${order.channel}` : ""}
                                  {` · ${status.label}`}
                                </span>
                                <span className="r9host-riwayat__mobile-code">{order.orderCode}</span>
                              </span>
                            </span>
                            <span className="r9host-riwayat__cell r9host-riwayat__cell--code">
                              {order.orderCode}
                            </span>
                            <span className="r9host-riwayat__cell r9host-riwayat__cell--date">
                              {formatOrderDate(order.createdAt)}
                            </span>
                            <span className="r9host-riwayat__cell r9host-riwayat__cell--channel">
                              {order.channel || "—"}
                            </span>
                            <span className="r9host-riwayat__cell r9host-riwayat__cell--status">
                              <span
                                className={`r9host-riwayat__badge r9host-riwayat__badge--${status.tone}`}
                              >
                                {status.label}
                              </span>
                            </span>
                            <span className="r9host-riwayat__cell r9host-riwayat__cell--amount">
                              <span className="r9host-riwayat__amount">
                                {formatRupiah(order.amount)}
                              </span>
                              <span className="r9host-riwayat__chevron">Detail</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {hasMore ? (
                  <div className="r9host-riwayat__mobile-more">
                    <Link
                      href={buildRiwayatHref({ q: q || undefined, all: true })}
                      className="r9host-riwayat__lihat-semua"
                    >
                      Lihat semua ({total})
                    </Link>
                  </div>
                ) : null}

                {!showAll && pageCount > 1 ? (
                  <nav className="r9host-riwayat__pager" aria-label="Navigasi halaman">
                    {safePage > 1 ? (
                      <Link
                        href={buildRiwayatHref({ q: q || undefined, page: safePage - 1 })}
                        className="r9host-riwayat__pager-btn"
                      >
                        ← Prev
                      </Link>
                    ) : (
                      <span className="r9host-riwayat__pager-btn r9host-riwayat__pager-btn--disabled">
                        ← Prev
                      </span>
                    )}
                    <span className="r9host-riwayat__pager-info">
                      {safePage} / {pageCount}
                    </span>
                    {safePage < pageCount ? (
                      <Link
                        href={buildRiwayatHref({ q: q || undefined, page: safePage + 1 })}
                        className="r9host-riwayat__pager-btn"
                      >
                        Next →
                      </Link>
                    ) : (
                      <span className="r9host-riwayat__pager-btn r9host-riwayat__pager-btn--disabled">
                        Next →
                      </span>
                    )}
                  </nav>
                ) : null}

                {showAll && total > MEMBER_ORDERS_PAGE_SIZE ? (
                  <div className="r9host-riwayat__collapse-all">
                    <Link
                      href={buildRiwayatHref({ q: q || undefined })}
                      className="r9host-riwayat__lihat-semua r9host-riwayat__lihat-semua--muted"
                    >
                      Kembali ke 15 per halaman
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
