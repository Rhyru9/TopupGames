import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CekTransaksiClient } from "@/components/orders/cek-transaksi-client";
import { getMemberSession } from "@/lib/member-auth";

export const metadata: Metadata = {
  title: "Cek Transaksi — R9host",
};

export default async function CekTransaksiPage() {
  const session = await getMemberSession();
  if (session?.user?.id) {
    redirect("/member/riwayat");
  }

  return <CekTransaksiClient />;
}
