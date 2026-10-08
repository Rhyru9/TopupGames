import "dotenv/config";
import { createPrismaClient } from "../lib/prisma";

const PLACEHOLDER_COVER = "/articles/placeholder-cover.svg";

const articleSeeds = [
  {
    slug: "cara-top-up-mobile-legends-dengan-aman",
    title: "Cara Top Up Mobile Legends dengan Aman",
    excerpt:
      "Panduan lengkap top up diamond Mobile Legends secara aman, cepat, dan harga final tanpa biaya tersembunyi.",
    content: `<p>Top up Mobile Legends (ML) semakin mudah, tapi penting memilih platform tepercaya agar diamond masuk tepat waktu ke akun kamu.</p>
<h2>Pilih platform resmi dan tepercaya</h2>
<p>Pastikan website top up menampilkan harga final, metode pembayaran jelas, dan riwayat transaksi yang bisa dicek kapan saja.</p>
<h2>Siapkan ID dan Server dengan benar</h2>
<p>Salah input ID atau server adalah penyebab paling umum diamond gagal masuk. Double-check sebelum bayar.</p>
<h2>Simpan bukti transaksi</h2>
<p>Screenshot invoice dan pantau status pesanan sampai status sukses. Jika ada kendala, hubungi CS dengan nomor invoice.</p>`,
    coverImageAlt: "Panduan top up Mobile Legends dengan aman",
    metaTitle: "Cara Top Up Mobile Legends Aman & Cepat — R9host",
    metaDescription:
      "Pelajari cara top up diamond Mobile Legends dengan aman di R9host. Tips cek ID, pilih metode bayar, dan pantau status pesanan.",
    metaKeywords:
      "top up mobile legends, diamond ml, cara top up ml, r9host, top up game aman",
    authorName: "R9host",
  },
  {
    slug: "tips-hemat-diamond-free-fire",
    title: "Tips Hemat Diamond Free Fire",
    excerpt:
      "Strategi hemat saat top up diamond Free Fire: manfaatkan promo, bandingkan paket, dan timing pembelian terbaik.",
    content: `<p>Diamond Free Fire (FF) dibutuhkan untuk battle pass, skin, dan event spesial. Berikut tips agar top up lebih hemat.</p>
<h2>Manfaatkan promo dan flash sale</h2>
<p>Ikuti promo berkala di R9host untuk dapat harga spesial pada paket diamond tertentu.</p>
<h2>Pilih paket sesuai kebutuhan</h2>
<p>Jangan asal beli paket besar jika kebutuhanmu kecil. Paket kecil lebih fleksibel dan minim waste.</p>
<h2>Top up di waktu event game</h2>
<p>Saat event FF berlangsung, diamond sering lebih berguna. Rencanakan top up sebelum event dimulai.</p>`,
    coverImageAlt: "Tips hemat diamond Free Fire",
    metaTitle: "Tips Hemat Diamond Free Fire — R9host",
    metaDescription:
      "Tips hemat top up diamond Free Fire: promo, pilihan paket, dan timing terbaik. Update tips di blog R9host.",
    metaKeywords:
      "top up free fire, diamond ff, tips hemat ff, promo free fire, r9host",
    authorName: "R9host",
  },
] as const;

async function main() {
  const prisma = createPrismaClient();
  const publishedAt = new Date();

  for (const item of articleSeeds) {
    await prisma.article.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        coverImageUrl: PLACEHOLDER_COVER,
        coverImageAlt: item.coverImageAlt,
        metaTitle: item.metaTitle,
        metaDescription: item.metaDescription,
        metaKeywords: item.metaKeywords,
        authorName: item.authorName,
        publishedAt,
        isActive: true,
      },
      create: {
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        coverImageUrl: PLACEHOLDER_COVER,
        coverImageAlt: item.coverImageAlt,
        metaTitle: item.metaTitle,
        metaDescription: item.metaDescription,
        metaKeywords: item.metaKeywords,
        authorName: item.authorName,
        publishedAt,
        isActive: true,
      },
    });
  }

  const count = await prisma.article.count();
  await prisma.$disconnect();

  console.log(`Seed artikel selesai: ${count} artikel.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
