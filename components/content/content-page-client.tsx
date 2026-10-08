"use client";

import { Header } from "@/components/landing/header";
import { StorefrontPageShell } from "@/components/landing/storefront-page-shell";

type ContentPageClientProps = {
  title: string;
  content: string;
  memberName?: string | null;
  memberImage?: string | null;
};

export function ContentPageClient({
  title,
  content,
  memberName = null,
  memberImage = null,
}: ContentPageClientProps) {
  return (
    <StorefrontPageShell className="content-page">
      <div id="page-top" className="pointer-events-none absolute top-0 left-0 h-3 w-px" />
      <Header homeHref="/" navPrefix="/" forceSolid memberName={memberName} memberImage={memberImage} />

      <main className="content-page__main">
        <div className="content-page__inner">
          <header className="content-page__head">
            <p className="content-page__eyebrow">Halaman</p>
            <h1 className="content-page__title">{title}</h1>
          </header>
          <article
            className="content-page__body console-rich-editor__prose"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </main>
    </StorefrontPageShell>
  );
}
