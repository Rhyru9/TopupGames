import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ArticleForm } from "@/components/console/artikel/article-form";
import { formatPublishedAtInput } from "@/lib/article/article-form";
import { prisma } from "@/lib/prisma";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Edit Artikel"
        description={`/artikel/${article.slug}`}
        backLink={{
          href: "/console/artikel",
          label: "← Kembali ke daftar artikel",
        }}
      />

      <div className="console-panel console-panel--padded">
        <ArticleForm
          mode="edit"
          articleId={article.id}
          initialValues={{
            slug: article.slug,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            coverImageUrl: article.coverImageUrl,
            coverImageAlt: article.coverImageAlt,
            metaTitle: article.metaTitle ?? "",
            metaDescription: article.metaDescription ?? "",
            metaKeywords: article.metaKeywords ?? "",
            ogImageUrl: article.ogImageUrl ?? "",
            authorName: article.authorName ?? "",
            publishedAt: formatPublishedAtInput(article.publishedAt),
            isActive: article.isActive,
          }}
        />
      </div>
    </div>
  );
}
