import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetailClient } from "@/components/content/article-detail-client";
import { buildArticleJsonLd } from "@/lib/article/build-article-json-ld";
import { buildArticleMetadata } from "@/lib/article/build-article-metadata";
import { getArticleBySlug } from "@/lib/article/get-article-by-slug";
import { getRelatedArticles } from "@/lib/article/get-latest-articles";
import { getMemberSession } from "@/lib/member-auth";

type ArticleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return { title: "Artikel tidak ditemukan" };
  }
  return buildArticleMetadata({ article });
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const [article, session] = await Promise.all([
    getArticleBySlug(slug),
    getMemberSession(),
  ]);
  if (!article) notFound();

  const relatedArticles = await getRelatedArticles(slug, 5);

  const jsonLd = await buildArticleJsonLd(article);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleDetailClient
        article={article}
        relatedArticles={relatedArticles}
        memberName={session?.user?.name ?? null}
        memberImage={session?.user?.image ?? null}
      />
    </>
  );
}
