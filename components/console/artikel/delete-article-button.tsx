"use client";

import { deleteArticle } from "@/app/console/(panel)/artikel/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { ConsoleIconButton, ConsoleIconTrash } from "@/components/console/console-icon-button";
import { useRef } from "react";

type DeleteArticleButtonProps = {
  articleId: string;
  articleTitle: string;
};

export function DeleteArticleButton({ articleId, articleTitle }: DeleteArticleButtonProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <form
      action={deleteArticle}
      className="console-table-action"
      onSubmit={async (event) => {
        if (skipConfirmRef.current) return;
        event.preventDefault();

        const confirmed = await confirm({
          title: "Hapus artikel?",
          description: `Artikel "${articleTitle}" akan dihapus permanen.`,
          confirmLabel: "Hapus",
          variant: "danger",
        });
        if (!confirmed) return;

        skipConfirmRef.current = true;
        event.currentTarget.requestSubmit();
      }}
    >
      <input type="hidden" name="articleId" value={articleId} />
      <ConsoleIconButton type="submit" title="Hapus artikel" variant="danger">
        <ConsoleIconTrash />
      </ConsoleIconButton>
    </form>
  );
}
