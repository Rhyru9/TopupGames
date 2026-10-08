/** Normalize TipTap output — treat empty paragraphs as blank. */
export function normalizeRichTextHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";

  const emptyPatterns = [
    /^<p><\/p>$/i,
    /^<p><br><\/p>$/i,
    /^<p><br\s*\/?><\/p>$/i,
  ];

  if (emptyPatterns.some((pattern) => pattern.test(trimmed))) {
    return "";
  }

  return trimmed;
}

export function isRichTextEmpty(html: string): boolean {
  return normalizeRichTextHtml(html) === "";
}
