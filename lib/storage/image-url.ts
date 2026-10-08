type ValidateImageUrlOptions = {
  required?: boolean;
};

export function validateImageUrl(
  value: string,
  options: ValidateImageUrlOptions = {},
): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return options.required ? "Gambar wajib diisi." : null;
  }

  if (trimmed.startsWith("/")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "URL gambar harus diawali http:// atau https://.";
    }
    return null;
  } catch {
    return "Path gambar harus valid (/... atau URL http).";
  }
}
