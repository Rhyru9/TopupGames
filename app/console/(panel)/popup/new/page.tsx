import { ConsolePageHeader } from "@/components/console/console-page-header";
import { PopupForm } from "@/components/console/popup/popup-form";

export default function NewPopupPage() {
  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Tambah Popup"
        description="Buat popup gambar atau teks. Dismiss default 5 menit setelah ditutup."
        backLink={{
          href: "/console/popup",
          label: "← Kembali ke daftar popup",
        }}
      />

      <div className="console-panel console-panel--padded">
        <PopupForm mode="create" />
      </div>
    </div>
  );
}
