import { ConsolePageHeader } from "@/components/console/console-page-header";
import { BannerForm } from "@/components/console/banners/banner-form";

export default function NewBannerPage() {
  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Tambah Banner"
        description="Upload gambar slider dan atur link tujuan jika perlu."
        backLink={{
          href: "/console/banners",
          label: "← Kembali ke daftar banner",
        }}
      />

      <div className="console-panel console-panel--padded">
        <BannerForm mode="create" />
      </div>
    </div>
  );
}
