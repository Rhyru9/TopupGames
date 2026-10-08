import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberSaldoTopupClient } from "@/components/member/member-saldo-topup-client";
import { getMemberSession } from "@/lib/member-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Topup Saldo — R9host",
};

export default async function MemberSaldoTopupPage() {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    redirect("/masuk?next=/member/saldo/topup");
  }

  const member = await prisma.member.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });
  if (!member) {
    redirect("/masuk?next=/member/saldo/topup");
  }

  return (
    <MemberSaldoTopupClient memberName={member.name} memberImage={member.image} />
  );
}
