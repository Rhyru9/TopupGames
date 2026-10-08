import Link from "next/link";
import type { PublicArticleCard } from "@/lib/article/article-form";

type LatestArticlesSectionProps = {
  articles: PublicArticleCard[];
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function LatestArticlesSection({ articles }: LatestArticlesSectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="latest-articles" aria-labelledby="latest-articles-title">
      <div className="latest-articles__head">
        <div>
          <p className="article-page__eyebrow">Blog &amp; Tips</p>
          <h2 id="latest-articles-title" className="latest-articles__title">
            Artikel Terbaru
          </h2>
        </div>
        <Link href="/artikel" className="latest-articles__link">
          Lihat semua →
        </Link>
      </div>

      <div className="latest-articles__grid">
        {articles.map((article, index) => (
          <Link
            key={article.slug}
            href={`/artikel/${article.slug}`}
            className="article-card article-card-in"
            style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
          >
            <div className="article-card__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.coverImageUrl}
                alt={article.coverImageAlt}
                className="article-card__image"
                loading={index < 3 ? "eager" : "lazy"}
              />
              <div className="article-card__shade" aria-hidden />
            </div>
            <div className="article-card__body">
              <time className="article-card__date" dateTime={new Date(article.publishedAt).toISOString()}>
                {formatDate(article.publishedAt)}
              </time>
              <h3 className="article-card__title">{article.title}</h3>
              <p className="article-card__excerpt">{article.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
