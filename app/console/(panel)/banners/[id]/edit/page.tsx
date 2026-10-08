import { ConsolePageHeader } from "@/components/console/console-page-header";
import { BannerForm } from "@/components/console/banners/banner-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type EditBannerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBannerPage({ params }: EditBannerPageProps) {
  const { id } = await params;

  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title={`Edit Banner — ${banner.title}`}
        description="Ubah gambar, link, urutan, atau status banner."
        backLink={{
          href: "/console/banners",
          label: "← Kembali ke daftar banner",
        }}
      />

      <div className="console-panel console-panel--padded">
        <BannerForm
          mode="edit"
          bannerId={banner.id}
          initialValues={{
            title: banner.title,
            imageUrl: banner.imageUrl,
            href: banner.href,
            sortOrder: banner.sortOrder,
            isActive: banner.isActive,
          }}
        />
      </div>
    </div>
  );
}
