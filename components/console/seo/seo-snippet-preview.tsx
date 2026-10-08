type SeoSnippetPreviewProps = {
  title: string;
  urlLabel: string;
  description: string;
  caption?: string;
};

export function SeoSnippetPreview({
  title,
  urlLabel,
  description,
  caption = "Preview cuplikan Google",
}: SeoSnippetPreviewProps) {
  return (
    <aside className="console-seo-snippet" aria-label={caption}>
      <p className="console-seo-snippet__eyebrow">{caption}</p>
      <div className="console-seo-snippet__card">
        <p className="console-seo-snippet__url">{urlLabel}</p>
        <p className="console-seo-snippet__title">{title || "—"}</p>
        <p className="console-seo-snippet__desc">
          {description || "Tidak ada deskripsi meta untuk ditampilkan."}
        </p>
      </div>
    </aside>
  );
}
