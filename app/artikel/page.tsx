import type { Metadata } from "next";
import { ArticleListClient } from "@/components/content/article-list-client";
import { buildArticleListingMetadata } from "@/lib/article/build-article-metadata";
import { getActiveArticles } from "@/lib/article/get-active-articles";
import { parsePagination } from "@/lib/console-pagination";
import { getMemberSession } from "@/lib/member-auth";

export async function generateMetadata(): Promise<Metadata> {
  return buildArticleListingMetadata();
}

type ArtikelListingPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function ArtikelListingPage({ searchParams }: ArtikelListingPageProps) {
  const params = await searchParams;
  const { skip, pageSize } = parsePagination(params, 12);
  const [{ items }, session] = await Promise.all([
    getActiveArticles({ skip, take: pageSize }),
    getMemberSession(),
  ]);

  return (
    <ArticleListClient
      articles={items}
      memberName={session?.user?.name ?? null}
      memberImage={session?.user?.image ?? null}
    />
  );
}
