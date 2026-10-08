import Link from "next/link";
import { InvoiceAccessForm } from "@/components/orders/invoice-access-form";
import { StorefrontSiteFrame } from "@/components/landing/storefront-site-frame";
import { InvoiceView } from "@/components/orders/invoice-view";
import { getMemberSession } from "@/lib/member-auth";
import { getPublicInvoiceByCode } from "@/lib/orders/get-public-invoice";

type InvoicePageProps = {
  params: Promise<{ orderCode: string }>;
};

export async function generateMetadata({ params }: InvoicePageProps) {
  const { orderCode } = await params;
  return {
    title: `Invoice ${orderCode.trim()}`,
    robots: { index: false, follow: false },
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { orderCode } = await params;
  const invoice = await getPublicInvoiceByCode(orderCode);
  if (!invoice) {
    return (
      <StorefrontSiteFrame footer="compact">
        <main className="invoice-page"><div className="invoice-page__inner">
          <InvoiceAccessForm orderCode={orderCode.trim()} />
        </div></main>
      </StorefrontSiteFrame>
    );
  }

  const session = await getMemberSession();
  const isMember = Boolean(session?.user?.id);

  return (
    <StorefrontSiteFrame footer="compact">
      <main className="invoice-page invoice-page--deposit">
      <div className="invoice-page__inner invoice-page__inner--deposit">
        <div className="invoice-page__top">
          <Link href="/" className="invoice-page__back">
            ← Beranda
          </Link>
          {isMember ? (
            <Link href="/member/riwayat" className="invoice-page__back">
              Riwayat →
            </Link>
          ) : (
            <Link href="/cek-transaksi" className="invoice-page__back">
              Cek transaksi →
            </Link>
          )}
        </div>
        <InvoiceView
          invoice={invoice}
          autoRefresh={
            invoice.paymentStatus === "UNPAID" ||
            (invoice.paymentStatus === "PAID" &&
              (invoice.fulfillmentStatus === "NONE" ||
                invoice.fulfillmentStatus === "QUEUED" ||
                invoice.fulfillmentStatus === "PROCESSING"))
          }
        />
      </div>
    </main>
    </StorefrontSiteFrame>
  );
}
