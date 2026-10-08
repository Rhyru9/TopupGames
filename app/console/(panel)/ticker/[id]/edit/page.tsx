import { ConsolePageHeader } from "@/components/console/console-page-header";
import { TickerForm } from "@/components/console/ticker/ticker-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type EditTickerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTickerPage({ params }: EditTickerPageProps) {
  const { id } = await params;

  const item = await prisma.tickerItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title={`Edit — ${item.label}`}
        description="Ubah teks, link, urutan, atau status item ticker."
        backLink={{
          href: "/console/ticker",
          label: "← Kembali ke daftar ticker",
        }}
      />

      <div className="console-panel console-panel--padded">
        <TickerForm
          mode="edit"
          tickerId={item.id}
          initialValues={{
            label: item.label,
            detail: item.detail,
            href: item.href,
            sortOrder: item.sortOrder,
            isActive: item.isActive,
          }}
        />
      </div>
    </div>
  );
}
