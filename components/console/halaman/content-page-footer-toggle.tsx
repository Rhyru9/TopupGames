"use client";

import { toggleContentPageFooter } from "@/app/console/(panel)/halaman/actions";

type ContentPageFooterToggleProps = {
  pageId: string;
  showInFooter: boolean;
};

export function ContentPageFooterToggle({ pageId, showInFooter }: ContentPageFooterToggleProps) {
  return (
    <form action={toggleContentPageFooter} className="console-table-action">
      <input type="hidden" name="pageId" value={pageId} />
      <button
        type="submit"
        className={`console-btn-ghost console-btn-ghost--compact ${showInFooter ? "is-active" : ""}`}
        title={showInFooter ? "Tampil di footer" : "Sembunyi dari footer"}
      >
        Footer
      </button>
    </form>
  );
}
