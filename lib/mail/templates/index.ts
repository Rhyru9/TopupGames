import { renderMailLayout } from "@/lib/mail/templates/layout";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderVerifyEmailTemplate(input: {
  siteName: string;
  memberName: string;
  verifyUrl: string;
}) {
  const subject = `Verifikasi email — ${input.siteName}`;
  const html = renderMailLayout({
    siteName: input.siteName,
    title: "Verifikasi email Anda",
    preview: "Konfirmasi alamat email akun member Anda.",
    statusLabel: "Verifikasi",
    bodyHtml: `<p>Halo <strong>${escape(input.memberName)}</strong>,</p>
<p>Terima kasih telah mendaftar. Silakan verifikasi alamat email Anda untuk mengaktifkan akun sepenuhnya. Tautan berlaku selama 24 jam.</p>`,
    ctaLabel: "Verifikasi email",
    ctaUrl: input.verifyUrl,
  });
  return { subject, html };
}

export function renderPasswordResetTemplate(input: {
  siteName: string;
  memberName: string;
  resetUrl: string;
}) {
  const subject = `Reset password — ${input.siteName}`;
  const html = renderMailLayout({
    siteName: input.siteName,
    title: "Permintaan reset password",
    preview: "Atur ulang password akun member Anda.",
    statusLabel: "Keamanan",
    tone: "warning",
    bodyHtml: `<p>Halo <strong>${escape(input.memberName)}</strong>,</p>
<p>Kami menerima permintaan untuk mengatur ulang password akun Anda. Jika Anda yang mengajukan, lanjutkan melalui tombol di bawah. Tautan berlaku selama 1 jam.</p>
<p style="color:#8a8a8a;font-size:13px;margin-bottom:0;">Abaikan email ini jika Anda tidak meminta reset password.</p>`,
    ctaLabel: "Atur ulang password",
    ctaUrl: input.resetUrl,
  });
  return { subject, html };
}

export function renderOrderCreatedTemplate(input: {
  siteName: string;
  orderCode: string;
  productName: string;
  amountLabel: string;
  invoiceUrl: string;
}) {
  const subject = `Invoice ${input.orderCode} siap dibayar — ${input.siteName}`;
  const html = renderMailLayout({
    siteName: input.siteName,
    title: "Invoice siap dibayar",
    preview: `Selesaikan pembayaran untuk invoice ${input.orderCode}.`,
    statusLabel: "Menunggu pembayaran",
    tone: "warning",
    bodyHtml: `<p>Invoice Anda telah dibuat. Silakan selesaikan pembayaran sebelum batas waktu kedaluwarsa agar pesanan dapat diproses.</p>`,
    details: [
      { label: "Kode invoice", value: input.orderCode },
      { label: "Produk", value: input.productName },
      { label: "Total", value: input.amountLabel },
    ],
    ctaLabel: "Bayar sekarang",
    ctaUrl: input.invoiceUrl,
  });
  return { subject, html };
}

export function renderOrderPaidTemplate(input: {
  siteName: string;
  orderCode: string;
  productName: string;
  amountLabel: string;
  invoiceUrl: string;
}) {
  const subject = `Pembayaran diterima — ${input.orderCode}`;
  const html = renderMailLayout({
    siteName: input.siteName,
    title: "Pembayaran telah diterima",
    preview: `Pembayaran untuk ${input.orderCode} berhasil. Pesanan sedang diproses.`,
    statusLabel: "Pembayaran lunas",
    tone: "success",
    bodyHtml: `<p>Terima kasih. Pembayaran Anda telah kami terima. Pesanan sedang diproses dan status akan diperbarui secara otomatis pada halaman invoice.</p>`,
    details: [
      { label: "Kode invoice", value: input.orderCode },
      { label: "Produk", value: input.productName },
      { label: "Total", value: input.amountLabel },
    ],
    ctaLabel: "Lihat invoice",
    ctaUrl: input.invoiceUrl,
  });
  return { subject, html };
}

export function renderOrderFailedTemplate(input: {
  siteName: string;
  orderCode: string;
  status: "EXPIRED" | "FAILED";
  productName?: string;
  amountLabel?: string;
  invoiceUrl: string;
}) {
  const isExpired = input.status === "EXPIRED";
  const subject = isExpired
    ? `Pembayaran kedaluwarsa — ${input.orderCode}`
    : `Pembayaran tidak berhasil — ${input.orderCode}`;
  const title = isExpired ? "Pembayaran kedaluwarsa" : "Pembayaran tidak berhasil";
  const statusLabel = isExpired ? "Kedaluwarsa" : "Gagal";
  const body = isExpired
    ? `<p>Batas waktu pembayaran untuk invoice ini telah berakhir. Silakan buat pesanan baru apabila Anda masih ingin melanjutkan transaksi.</p>`
    : `<p>Pembayaran untuk invoice ini tidak berhasil diproses. Silakan buat pesanan baru atau gunakan metode pembayaran lain.</p>`;

  const details = [
    { label: "Kode invoice", value: input.orderCode },
    ...(input.productName ? [{ label: "Produk", value: input.productName }] : []),
    ...(input.amountLabel ? [{ label: "Total", value: input.amountLabel }] : []),
  ];

  const html = renderMailLayout({
    siteName: input.siteName,
    title,
    preview: `${title} untuk ${input.orderCode}.`,
    statusLabel,
    tone: "danger",
    bodyHtml: body,
    details,
    ctaLabel: "Lihat invoice",
    ctaUrl: input.invoiceUrl,
  });
  return { subject, html };
}

export function renderOrderFulfillmentFailedTemplate(input: {
  siteName: string;
  orderCode: string;
  productName: string;
  amountLabel: string;
  invoiceUrl: string;
}) {
  const subject = `Pesanan gagal diproses — ${input.orderCode}`;
  const html = renderMailLayout({
    siteName: input.siteName,
    title: "Pesanan gagal diproses",
    preview: `Pembayaran ${input.orderCode} telah diterima, namun pengisian belum berhasil.`,
    statusLabel: "Pesanan gagal",
    tone: "danger",
    bodyHtml: `<p>Pembayaran telah diterima, namun pengisian belum berhasil. Silakan hubungi layanan pelanggan dengan menyertakan kode invoice di bawah ini agar kami dapat membantu menindaklanjuti.</p>`,
    details: [
      { label: "Kode invoice", value: input.orderCode },
      { label: "Produk", value: input.productName },
      { label: "Total", value: input.amountLabel },
    ],
    ctaLabel: "Lihat invoice",
    ctaUrl: input.invoiceUrl,
  });
  return { subject, html };
}

export function renderOrderFulfillmentSuccessTemplate(input: {
  siteName: string;
  orderCode: string;
  productName: string;
  amountLabel: string;
  serialNumber?: string | null;
  invoiceUrl: string;
}) {
  const subject = `Pesanan berhasil — ${input.orderCode}`;
  const sn = input.serialNumber?.trim() || "";
  const html = renderMailLayout({
    siteName: input.siteName,
    title: "Pesanan berhasil diproses",
    preview: `Pesanan ${input.orderCode} telah berhasil diproses.`,
    statusLabel: "Berhasil",
    tone: "success",
    bodyHtml: `<p>Pesanan Anda telah berhasil diproses. Rincian transaksi tersedia pada halaman invoice.</p>`,
    details: [
      { label: "Kode invoice", value: input.orderCode },
      { label: "Produk", value: input.productName },
      { label: "Total", value: input.amountLabel },
      ...(sn ? [{ label: "Serial / SN", value: sn }] : []),
    ],
    ctaLabel: "Lihat invoice",
    ctaUrl: input.invoiceUrl,
  });
  return { subject, html };
}

export function renderDepositPaidTemplate(input: {
  siteName: string;
  depositCode: string;
  amountLabel: string;
  saldoUrl: string;
}) {
  const subject = `Top-up saldo berhasil — ${input.depositCode}`;
  const html = renderMailLayout({
    siteName: input.siteName,
    title: "Saldo berhasil ditambahkan",
    preview: `Top-up ${input.depositCode} berhasil diproses.`,
    statusLabel: "Berhasil",
    tone: "success",
    bodyHtml: `<p>Top-up saldo Anda telah berhasil. Nominal telah ditambahkan ke akun member.</p>`,
    details: [
      { label: "Kode top-up", value: input.depositCode },
      { label: "Nominal", value: input.amountLabel },
    ],
    ctaLabel: "Lihat saldo",
    ctaUrl: input.saldoUrl,
  });
  return { subject, html };
}

export function renderDepositFailedTemplate(input: {
  siteName: string;
  depositCode: string;
  status: "EXPIRED" | "FAILED";
  amountLabel?: string;
  saldoUrl: string;
}) {
  const isExpired = input.status === "EXPIRED";
  const subject = isExpired
    ? `Top-up saldo kedaluwarsa — ${input.depositCode}`
    : `Top-up saldo tidak berhasil — ${input.depositCode}`;
  const title = isExpired ? "Top-up saldo kedaluwarsa" : "Top-up saldo tidak berhasil";
  const body = isExpired
    ? `<p>Batas waktu pembayaran top-up saldo telah berakhir. Silakan buat top-up baru apabila Anda masih ingin menambah saldo.</p>`
    : `<p>Pembayaran top-up saldo tidak berhasil diproses. Silakan coba kembali dengan metode pembayaran yang tersedia.</p>`;

  const html = renderMailLayout({
    siteName: input.siteName,
    title,
    preview: `${title} (${input.depositCode}).`,
    statusLabel: isExpired ? "Kedaluwarsa" : "Gagal",
    tone: "danger",
    bodyHtml: body,
    details: [
      { label: "Kode top-up", value: input.depositCode },
      ...(input.amountLabel ? [{ label: "Nominal", value: input.amountLabel }] : []),
    ],
    ctaLabel: "Ke halaman saldo",
    ctaUrl: input.saldoUrl,
  });
  return { subject, html };
}

export function renderMailTestTemplate(input: { siteName: string }) {
  const subject = `Uji SMTP — ${input.siteName}`;
  const html = renderMailLayout({
    siteName: input.siteName,
    title: "Uji email berhasil",
    preview: "Konfigurasi SMTP siap digunakan.",
    statusLabel: "Tes",
    bodyHtml: `<p>Ini adalah email uji coba dari pengaturan SMTP <strong>${escape(input.siteName)}</strong>.</p>
<p>Jika Anda menerima pesan ini, konfigurasi pengiriman email sudah berjalan dengan benar.</p>`,
  });
  return { subject, html };
}
