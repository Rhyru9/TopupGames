import { redirectConsoleRoute } from "@/lib/console-route-redirect";

export default async function ProductTypesRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectConsoleRoute("/console/jenis-produk", await searchParams, { gameId: "productId" });
}
