import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ContentPageForm } from "@/components/console/halaman/content-page-form";

export default function NewContentPagePage() {
  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Tambah Halaman"
        description="Buat halaman statis baru untuk ditampilkan di footer dan URL publik /halaman/[slug]."
      />
      <div className="console-panel console-panel--padded">
        <ContentPageForm mode="create" />
      </div>
    </div>
  );
}