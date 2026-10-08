import { ConsolePageHeader } from "@/components/console/console-page-header";
import { ExpenseForm } from "@/components/console/laporan/expense-form";

export default function NewExpensePage() {
  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Laporan"
        title="Tambah pengeluaran"
        description="Catat beban baru dengan kategori dan bukti opsional."
        backLink={{
          href: "/console/laporan/pengeluaran",
          label: "← Kembali ke daftar pengeluaran",
        }}
      />

      <div className="console-panel console-panel--padded">
        <ExpenseForm mode="create" />
      </div>
    </div>
  );
}
