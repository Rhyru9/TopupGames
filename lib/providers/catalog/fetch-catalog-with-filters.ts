import {
  type CatalogFetchResult,
  type DigiflazzCatalogFilters,
  type IakCatalogFilters,
  type MelostoreCatalogFilters,
} from "@/lib/providers/catalog/catalog-types";
import { fetchDigiflazzCatalog } from "@/lib/providers/catalog/fetch-digiflazz-catalog";
import { fetchIakCatalog } from "@/lib/providers/catalog/fetch-iak-catalog";
import { fetchMelostoreCatalog } from "@/lib/providers/catalog/fetch-melostore-catalog";
import {
  parseDigiflazzFilters,
  parseMelostoreFilters,
} from "@/lib/providers/catalog/match-catalog-item";
import { resolveProviderApiUrl } from "@/lib/providers/provider-api-urls";

export async function fetchCatalogWithFilters(input: {
  providerSlug: string;
  providerId: string;
  config: Record<string, unknown>;
  apiUrl: string;
  sandboxMode: boolean;
  filters: DigiflazzCatalogFilters | MelostoreCatalogFilters | IakCatalogFilters;
  skipCache?: boolean;
}): Promise<CatalogFetchResult> {
  if (input.providerSlug === "digiflazz") {
    const digiFilters = parseDigiflazzFilters(input.filters);
    // Brand/type/category already filtered inside fetchDigiflazzCatalog (full list + local filter).
    return fetchDigiflazzCatalog({
      providerId: input.providerId,
      config: input.config,
      apiUrl: input.apiUrl,
      sandboxMode: input.sandboxMode,
      filters: digiFilters,
    });
  }

  if (input.providerSlug === "melostore") {
    const meloFilters = parseMelostoreFilters(input.filters);
    const apiKey = String(input.config.apiKey ?? "").trim();
    const secretKey = String(input.config.secretKey ?? "").trim();
    return fetchMelostoreCatalog({
      providerId: input.providerId,
      apiUrl: resolveProviderApiUrl("melostore", input.config, input.sandboxMode),
      apiKey,
      secretKey,
      filters: meloFilters,
      skipCache: input.skipCache,
    });
  }

  if (input.providerSlug === "iak") {
    return fetchIakCatalog({
      providerId: input.providerId,
      config: input.config,
      apiUrl: input.apiUrl,
      sandboxMode: input.sandboxMode,
      filters: input.filters as IakCatalogFilters,
    });
  }

  return { items: [], meta: {} };
}
