import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ArticleForm } from "@/components/console/artikel/article-form";

export default function NewArticlePage() {
  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Tambah Artikel"
        description="Tulis artikel dengan cover dan meta SEO lengkap."
        backLink={{
          href: "/console/artikel",
          label: "← Kembali ke daftar artikel",
        }}
      />

      <div className="console-panel console-panel--padded">
        <ArticleForm mode="create" />
      </div>
    </div>
  );
}
