import { ConsolePageHeader } from "@/components/console/console-page-header";
import { TickerForm } from "@/components/console/ticker/ticker-form";

export default function NewTickerPage() {
  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Konten"
        title="Tambah Teks Berjalan"
        description="Contoh: Mobile Legends / Flash Diamond −10%"
        backLink={{
          href: "/console/ticker",
          label: "← Kembali ke daftar ticker",
        }}
      />

      <div className="console-panel console-panel--padded">
        <TickerForm mode="create" />
      </div>
    </div>
  );
}
