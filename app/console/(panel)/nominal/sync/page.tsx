import { redirectConsoleRoute } from "@/lib/console-route-redirect";

export default async function NominalSyncRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectConsoleRoute("/console/product-skus/sync", await searchParams, { gameId: "productId" });
}
