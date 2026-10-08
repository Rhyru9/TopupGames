import Link from "next/link";

type ProductSyncLauncherProps = {
  defaultProductId?: string;
};

function buildSyncHref(productId?: string) {
  if (!productId) return "/console/product-skus/sync";
  return `/console/product-skus/sync?productId=${encodeURIComponent(productId)}`;
}

export function ProductSyncLauncher({ defaultProductId }: ProductSyncLauncherProps) {
  return (
    <Link
      href={buildSyncHref(defaultProductId)}
      className="console-btn-secondary console-page-header__action"
    >
      Sync SKU
    </Link>
  );
}
