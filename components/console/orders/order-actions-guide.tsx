"use client";

type OrderActionsGuideProps = {
  fulfillmentStatus: string;
  paymentStatus: string;
};

function guideSummary(paymentStatus: string, fulfillmentStatus: string): string {
  if (paymentStatus !== "PAID") {
    return "Aksi fulfillment tersedia setelah pembayaran lunas.";
  }
  switch (fulfillmentStatus) {
    case "QUEUED":
    case "PROCESSING":
      return "Order sedang diproses. Cek respons provider di kiri, lalu pilih aksi di bawah bila perlu.";
    case "FAILED":
      return "Pengiriman gagal — retry, kaitkan member (guest), atau kembalikan saldo (member).";
    case "SUCCESS":
      return "Provider sukses. Jika item belum masuk: cek ulang provider, lalu tandai gagal (koreksi).";
    case "CANCELLED":
      return "Order ditutup. Tidak ada aksi tersisa.";
    default:
      return "Pilih langkah di bawah sesuai kebutuhan.";
  }
}

export function OrderActionsGuide({
  fulfillmentStatus,
  paymentStatus,
}: OrderActionsGuideProps) {
  return (
    <p className="console-order-actions__guide-lead">
      {guideSummary(paymentStatus, fulfillmentStatus)}
    </p>
  );
}
