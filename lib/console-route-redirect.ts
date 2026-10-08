import { redirect } from "next/navigation";

type LegacySearchParams = Record<string, string | string[] | undefined>;

function buildQuery(params: LegacySearchParams, remap: Record<string, string> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    const values = Array.isArray(value) ? value : [value];
    const targetKey = remap[key] ?? key;
    for (const entry of values) {
      if (entry) query.append(targetKey, entry);
    }
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function redirectConsoleRoute(
  targetPath: string,
  searchParams: LegacySearchParams,
  remap: Record<string, string> = {},
) {
  redirect(`${targetPath}${buildQuery(searchParams, remap)}`);
}
