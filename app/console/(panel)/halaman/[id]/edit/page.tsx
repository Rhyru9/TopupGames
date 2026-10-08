import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ContentPageForm } from "@/components/console/halaman/content-page-form";
import { prisma } from "@/lib/prisma";

type EditContentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditContentPagePage({ params }: EditContentPageProps) {
  const { id } = await params;
  const page = await prisma.contentPage.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Edit Halaman"
        description={`/halaman/${page.slug}`}
      />
      <ContentPageForm
        mode="edit"
        pageId={page.id}
        initialValues={{
          slug: page.slug,
          title: page.title,
          content: page.content,
          sortOrder: page.sortOrder,
          isActive: page.isActive,
          showInFooter: page.showInFooter,
        }}
      />
    </div>
  );
}
