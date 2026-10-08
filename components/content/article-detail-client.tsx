"use client";

import Link from "next/link";
import { ArticleSidebar } from "@/components/content/article-sidebar";
import { Header } from "@/components/landing/header";
import { StorefrontPageShell } from "@/components/landing/storefront-page-shell";
import type { PublicArticleCard, PublicArticleDetail } from "@/lib/article/article-form";

type ArticleDetailClientProps = {
  article: PublicArticleDetail;
  relatedArticles?: PublicArticleCard[];
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

export function ArticleDetailClient({
  article,
  relatedArticles = [],
  memberName = null,
  memberImage = null,
}: ArticleDetailClientProps) {
  return (
    <StorefrontPageShell className="article-page article-detail">
      <div id="page-top" className="pointer-events-none absolute top-0 left-0 h-3 w-px" />
      <Header
        homeHref="/"
        navPrefix="/"
        forceSolid
        memberName={memberName}
        memberImage={memberImage}
      />

      <main className="article-page__main">
        <div className="article-detail__layout">
          <article className="article-detail__content">
            <nav className="article-detail__breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span aria-hidden>/</span>
            <Link href="/artikel">Artikel</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">{article.title}</span>
          </nav>

          <header className="article-detail__head">
            <p className="article-page__eyebrow">Artikel</p>
            <h1 className="article-detail__title">{article.title}</h1>
            <div className="article-detail__meta">
              <time dateTime={new Date(article.publishedAt).toISOString()}>
                {formatDate(article.publishedAt)}
              </time>
              {article.authorName ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{article.authorName}</span>
                </>
              ) : null}
            </div>
          </header>

          <div className="article-detail__cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImageUrl}
              alt={article.coverImageAlt}
              className="article-detail__cover-image"
              fetchPriority="high"
            />
          </div>

          <div
            className="article-detail__body console-rich-editor__prose"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          </article>

          <ArticleSidebar articles={relatedArticles} />
        </div>
      </main>
    </StorefrontPageShell>
  );
}
