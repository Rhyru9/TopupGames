"use client";

import { ConsoleIconButton, ConsoleIconEdit } from "@/components/console/console-icon-button";
import { ArticleStatusToggle } from "./article-status-toggle";
import { DeleteArticleButton } from "./delete-article-button";

type ArticleRowActionsProps = {
  articleId: string;
  articleTitle: string;
  isActive: boolean;
};

export function ArticleRowActions({ articleId, articleTitle, isActive }: ArticleRowActionsProps) {
  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <ArticleStatusToggle articleId={articleId} isActive={isActive} />
      <ConsoleIconButton
        href={`/console/artikel/${articleId}/edit`}
        title="Edit artikel"
        variant="accent"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <DeleteArticleButton articleId={articleId} articleTitle={articleTitle} />
    </div>
  );
}
