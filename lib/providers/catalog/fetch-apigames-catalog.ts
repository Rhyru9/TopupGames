import type { CatalogFetchResult } from "@/lib/providers/catalog/catalog-types";

/**
 * API Games tidak punya pricelist H2H terbuka seperti Digiflazz/Melostore/IAK.
 * SKU diisi manual di console (kode produk dari dashboard UniPin/Kiosgamer yang terhubung).
 */
export async function fetchApigamesCatalog(_input: {
  providerId: string;
  config: Record<string, unknown>;
  apiUrl: string;
  sandboxMode?: boolean;
}): Promise<CatalogFetchResult> {
  throw new Error(
    "API Games belum mendukung sync katalog otomatis. Isi SKU provider secara manual di form produk.",
  );
}
