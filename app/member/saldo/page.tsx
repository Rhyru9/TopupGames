import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/landing/header";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { formatRupiah } from "@/lib/format-rupiah";
import { getOrCreateMemberBalance } from "@/lib/member/member-balance";
import {
  MEMBER_LEDGER_DIRECTION_LABEL,
} from "@/lib/member/member-ledger-labels";
import { listMemberLedgerEntries } from "@/lib/member/member-ledger";
import {
  listMemberDeposits,
  MEMBER_DEPOSIT_PAGE_SIZE,
} from "@/lib/member/member-deposits";
import { getMemberSession } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Saldo — R9host",
};

type MemberSaldoPageProps = {
  searchParams: Promise<{ tab?: string; page?: string }>;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function MemberSaldoPage({ searchParams }: MemberSaldoPageProps) {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    redirect("/masuk?next=/member/saldo");
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });
  if (!member) {
    redirect("/masuk?next=/member/saldo");
  }

  const sp = await searchParams;
  const tab = sp.tab === "topup" ? "topup" : "mutasi";
  const pageRaw = Number.parseInt(sp.page || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const skip = (page - 1) * MEMBER_DEPOSIT_PAGE_SIZE;

  const balance = await getOrCreateMemberBalance(session.user.id);

  const [ledger, deposits] = await Promise.all([
    tab === "mutasi"
      ? listMemberLedgerEntries({
          memberId: session.user.id,
          kind: "SALDO",
          skip,
          take: MEMBER_DEPOSIT_PAGE_SIZE,
        })
      : Promise.resolve({ entries: [], total: 0 }),
    tab === "topup"
      ? listMemberDeposits({
          memberId: session.user.id,
          skip,
          take: MEMBER_DEPOSIT_PAGE_SIZE,
        })
      : Promise.resolve({ deposits: [], total: 0 }),
  ]);

  const total = tab === "mutasi" ? ledger.total : deposits.total;
  const pageCount = Math.max(1, Math.ceil(total / MEMBER_DEPOSIT_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  function tabHref(nextTab: "mutasi" | "topup") {
    return nextTab === "mutasi" ? "/member/saldo" : "/member/saldo?tab=topup";
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (tab === "topup") params.set("tab", "topup");
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/member/saldo?${qs}` : "/member/saldo";
  }

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
          <div className="r9host-saldo">
            <div className="r9host-saldo__toolbar">
              <div>
                <p className="r9host-saldo__eyebrow">Akun member</p>
                <h1 className="r9host-saldo__title">Saldo</h1>
              </div>
              <Link href="/member" className="r9host-saldo__back">
                ← Kembali
              </Link>
            </div>

            <section className="r9host-saldo__hero" aria-label="Saldo saat ini">
              <div className="r9host-saldo__hero-copy">
                <p className="r9host-saldo__hero-label">Saldo tersedia</p>
                <p className="r9host-saldo__hero-value">{formatRupiah(balance.saldo)}</p>
                <p className="r9host-saldo__hero-lead">
                  Topup via DOKU — saldo masuk otomatis setelah pembayaran lunas.
                </p>
              </div>
              <Link href="/member/saldo/topup" className="r9host-saldo__cta">
                Topup Saldo
              </Link>
            </section>

            <div className="r9host-saldo__tabs" role="tablist" aria-label="Riwayat saldo">
              <Link
                href={tabHref("mutasi")}
                role="tab"
                aria-selected={tab === "mutasi"}
                className={`r9host-saldo__tab ${tab === "mutasi" ? "r9host-saldo__tab--active" : ""}`}
              >
                Mutasi
              </Link>
              <Link
                href={tabHref("topup")}
                role="tab"
                aria-selected={tab === "topup"}
                className={`r9host-saldo__tab ${tab === "topup" ? "r9host-saldo__tab--active" : ""}`}
              >
                Riwayat topup
              </Link>
            </div>

            {tab === "mutasi" ? (
              <section className="r9host-saldo__panel" aria-label="Mutasi saldo">
                {ledger.entries.length === 0 ? (
                  <div className="r9host-saldo__empty">
                    <p className="r9host-saldo__empty-title">Belum ada mutasi</p>
                    <p className="r9host-saldo__empty-text">
                      Riwayat masuk/keluar saldo akan muncul di sini setelah topup atau pemakaian.
                    </p>
                    <Link href="/member/saldo/topup" className="r9host-saldo__empty-cta">
                      Topup sekarang
                    </Link>
                  </div>
                ) : (
                  <ul className="r9host-saldo__list">
                    {ledger.entries.map((entry) => {
                      const isCredit = entry.direction === "CREDIT";
                      return (
                        <li key={entry.id} className="r9host-saldo__row">
                          <div className="r9host-saldo__row-main">
                            <p className="r9host-saldo__row-title">{entry.reason}</p>
                            <p className="r9host-saldo__row-meta">
                              {formatDate(entry.createdAt)} ·{" "}
                              {MEMBER_LEDGER_DIRECTION_LABEL[entry.direction]}
                            </p>
                            <p className="r9host-saldo__row-balance">
                              <span className="r9host-saldo__row-balance-item">
                                <span className="r9host-saldo__row-balance-label">Sebelum</span>
                                <span>{formatRupiah(entry.balanceBefore)}</span>
                              </span>
                              <span className="r9host-saldo__row-balance-arrow" aria-hidden>
                                →
                              </span>
                              <span className="r9host-saldo__row-balance-item">
                                <span className="r9host-saldo__row-balance-label">Sesudah</span>
                                <span>{formatRupiah(entry.balanceAfter)}</span>
                              </span>
                            </p>
                          </div>
                          <div className="r9host-saldo__row-side">
                            <p
                              className={`r9host-saldo__row-amount ${
                                isCredit
                                  ? "r9host-saldo__row-amount--in"
                                  : "r9host-saldo__row-amount--out"
                              }`}
                            >
                              {isCredit ? "+" : "−"}
                              {formatRupiah(entry.amount)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ) : (
              <section className="r9host-saldo__panel" aria-label="Riwayat topup">
                {deposits.deposits.length === 0 ? (
                  <div className="r9host-saldo__empty">
                    <p className="r9host-saldo__empty-title">Belum ada topup</p>
                    <p className="r9host-saldo__empty-text">
                      Setelah kamu topup, status dan nominalnya tercatat di sini.
                    </p>
                    <Link href="/member/saldo/topup" className="r9host-saldo__empty-cta">
                      Topup sekarang
                    </Link>
                  </div>
                ) : (
                  <ul className="r9host-saldo__list">
                    {deposits.deposits.map((dep) => {
                      const href =
                        dep.paymentStatus === "UNPAID"
                          ? `/member/saldo/bayar/${dep.depositCode}`
                          : undefined;
                      const inner = (
                        <>
                          <div className="r9host-saldo__row-main">
                            <p className="r9host-saldo__row-title">{dep.depositCode}</p>
                            <p className="r9host-saldo__row-meta">
                              {formatDate(dep.createdAt)}
                              {dep.channelName ? ` · ${dep.channelName}` : ""}
                            </p>
                          </div>
                          <div className="r9host-saldo__row-side">
                            <p className="r9host-saldo__row-amount">
                              {formatRupiah(dep.amount)}
                            </p>
                            <p className="r9host-saldo__row-after">
                              Bayar {formatRupiah(dep.totalAmount)} · {dep.statusLabel}
                            </p>
                            <span
                              className={`r9host-saldo__badge r9host-saldo__badge--${dep.paymentStatus.toLowerCase()}`}
                            >
                              {dep.statusLabel}
                            </span>
                          </div>
                          {href ? <span className="r9host-saldo__chevron" aria-hidden>›</span> : null}
                        </>
                      );

                      return (
                        <li key={dep.id}>
                          {href ? (
                            <Link
                              href={href}
                              className={`r9host-saldo__row r9host-saldo__row--link r9host-saldo__row--${dep.paymentStatus.toLowerCase()}`}
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div
                              className={`r9host-saldo__row r9host-saldo__row--${dep.paymentStatus.toLowerCase()}`}
                            >
                              {inner}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {total > MEMBER_DEPOSIT_PAGE_SIZE ? (
              <nav className="r9host-saldo__pager" aria-label="Navigasi halaman">
                <Link
                  href={pageHref(Math.max(1, safePage - 1))}
                  className={`r9host-saldo__pager-btn ${safePage <= 1 ? "r9host-saldo__pager-btn--disabled" : ""}`}
                  aria-disabled={safePage <= 1}
                >
                  Sebelumnya
                </Link>
                <span className="r9host-saldo__pager-info">
                  {safePage} / {pageCount}
                </span>
                <Link
                  href={pageHref(Math.min(pageCount, safePage + 1))}
                  className={`r9host-saldo__pager-btn ${safePage >= pageCount ? "r9host-saldo__pager-btn--disabled" : ""}`}
                  aria-disabled={safePage >= pageCount}
                >
                  Berikutnya
                </Link>
              </nav>
            ) : null}
          </div>
        </div>
      </main>
    </StorefrontSiteFrame>
  );
}
