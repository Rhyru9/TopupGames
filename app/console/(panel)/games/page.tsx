import { redirectConsoleRoute } from "@/lib/console-route-redirect";

export default async function GamesRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectConsoleRoute("/console/produk", await searchParams);
}
