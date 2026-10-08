import { redirectConsoleRoute } from "@/lib/console-route-redirect";

export default async function ProductsNewRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectConsoleRoute("/console/product-skus/new", await searchParams, { gameId: "productId" });
}
