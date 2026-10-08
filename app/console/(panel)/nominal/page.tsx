import { redirectConsoleRoute } from "@/lib/console-route-redirect";

export default async function NominalRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectConsoleRoute("/console/product-skus", await searchParams);
}
