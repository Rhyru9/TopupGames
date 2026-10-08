import Link from "next/link";
import type { SeoEntityReport } from "@/lib/seo/get-seo-report";
import { SeoSnippetPreview } from "./seo-snippet-preview";

type SeoGlobalPanelProps = {
  entity: SeoEntityReport;
};

export function SeoGlobalPanel({ entity }: SeoGlobalPanelProps) {
  return (
    <div className="console-seo-global">
      <div className="console-seo-global__grid">
        <SeoSnippetPreview
          title={entity.snippetTitle}
          urlLabel={entity.snippetUrl}
          description={entity.snippetDescription}
        />

        <div className="console-panel console-panel--padded console-seo-global__checklist">
          <div className="console-seo-global__head">
            <div>
              <h2 className="console-seo-global__title">Checklist SEO situs</h2>
              <p className="console-seo-global__subtitle">
                Meta global dari Pengaturan Website.
              </p>
            </div>
            {entity.editHref ? (
              <Link href={entity.editHref} className="console-btn-secondary">
                Edit SEO situs
              </Link>
            ) : null}
          </div>

          <ul className="console-seo-checklist">
            {entity.flags.map((flag) => (
              <li
                key={flag.code}
                className={`console-seo-checklist__item console-seo-checklist__item--${flag.severity}`}
              >
                <span className="console-seo-checklist__dot" aria-hidden />
                <span>{flag.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
