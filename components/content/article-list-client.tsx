"use client";

import Link from "next/link";
import { Header } from "@/components/landing/header";
import { StorefrontPageShell } from "@/components/landing/storefront-page-shell";
import type { PublicArticleCard } from "@/lib/article/article-form";

type ArticleListClientProps = {
  articles: PublicArticleCard[];
  memberName?: string | null;
  memberImage?: string | null;
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ArticleListClient({
  articles,
  memberName = null,
  memberImage = null,
}: ArticleListClientProps) {
  return (
    <StorefrontPageShell className="article-page">
      <div id="page-top" className="pointer-events-none absolute top-0 left-0 h-3 w-px" />
      <Header
        homeHref="/"
        navPrefix="/"
        forceSolid
        memberName={memberName}
        memberImage={memberImage}
      />

      <main className="article-page__main">
        <div className="article-page__inner">
          <header className="article-page__head">
            <p className="article-page__eyebrow">Blog &amp; Tips</p>
            <h1 className="article-page__title">
              Artikel
              <span className="article-page__title-accent">Top Up Game</span>
            </h1>
            <p className="article-page__lead">
              Panduan, tips hemat, dan info terbaru seputar top up game favoritmu.
            </p>
          </header>

          {articles.length === 0 ? (
            <div className="article-page__empty">
              <p>Belum ada artikel. Kembali lagi nanti!</p>
              <Link href="/" className="article-page__empty-link">
                Kembali ke beranda
              </Link>
            </div>
          ) : (
            <div className="article-grid">
              {articles.map((article, index) => (
                <Link
                  key={article.slug}
                  href={`/artikel/${article.slug}`}
                  className="article-card article-card-in"
                  style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
                >
                  <div className="article-card__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.coverImageUrl}
                      alt={article.coverImageAlt}
                      className="article-card__image"
                      loading={index < 4 ? "eager" : "lazy"}
                    />
                    <div className="article-card__shade" aria-hidden />
                  </div>
                  <div className="article-card__body">
                    <time className="article-card__date" dateTime={new Date(article.publishedAt).toISOString()}>
                      {formatDate(article.publishedAt)}
                    </time>
                    <h2 className="article-card__title">{article.title}</h2>
                    <p className="article-card__excerpt">{article.excerpt}</p>
                    {article.authorName ? (
                      <p className="article-card__author">{article.authorName}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </StorefrontPageShell>
  );
}
