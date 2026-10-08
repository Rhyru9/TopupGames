import Link from "next/link";
import type { PublicArticleCard } from "@/lib/article/article-form";

type ArticleSidebarProps = {
  articles: PublicArticleCard[];
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ArticleSidebar({ articles }: ArticleSidebarProps) {
  if (articles.length === 0) return null;

  return (
    <aside className="article-sidebar" aria-labelledby="article-sidebar-title">
      <div className="article-sidebar__panel">
        <p id="article-sidebar-title" className="article-sidebar__eyebrow">
          Baca juga
        </p>
        <h2 className="article-sidebar__title">Artikel Lainnya</h2>

        <ul className="article-sidebar__list">
          {articles.map((item) => (
            <li key={item.slug}>
              <Link href={`/artikel/${item.slug}`} className="article-sidebar__item">
                <div className="article-sidebar__thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.coverImageUrl}
                    alt={item.coverImageAlt}
                    className="article-sidebar__thumb-image"
                    loading="lazy"
                  />
                </div>
                <div className="article-sidebar__copy">
                  <time
                    className="article-sidebar__date"
                    dateTime={new Date(item.publishedAt).toISOString()}
                  >
                    {formatDate(item.publishedAt)}
                  </time>
                  <p className="article-sidebar__item-title">{item.title}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/artikel" className="article-sidebar__all">
          Lihat semua artikel →
        </Link>
      </div>
    </aside>
  );
}
