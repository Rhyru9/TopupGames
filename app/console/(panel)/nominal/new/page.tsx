import { redirectConsoleRoute } from "@/lib/console-route-redirect";

export default async function NominalNewRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectConsoleRoute("/console/product-skus/new", await searchParams, { gameId: "productId" });
}
