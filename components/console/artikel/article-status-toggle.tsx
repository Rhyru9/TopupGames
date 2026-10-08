"use client";

import { toggleArticleStatus } from "@/app/console/(panel)/artikel/actions";

type ArticleStatusToggleProps = {
  articleId: string;
  isActive: boolean;
};

export function ArticleStatusToggle({ articleId, isActive }: ArticleStatusToggleProps) {
  return (
    <form action={toggleArticleStatus} className="console-table-action">
      <input type="hidden" name="articleId" value={articleId} />
      <label
        className="console-toggle console-toggle--compact"
        title={isActive ? "Artikel aktif" : "Artikel draft"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isActive}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isActive ? "Nonaktifkan artikel" : "Aktifkan artikel"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
