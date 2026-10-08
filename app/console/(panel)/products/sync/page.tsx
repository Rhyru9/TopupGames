import { redirectConsoleRoute } from "@/lib/console-route-redirect";

export default async function ProductsSyncRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectConsoleRoute("/console/product-skus/sync", await searchParams, { gameId: "productId" });
}
