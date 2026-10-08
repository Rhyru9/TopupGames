import { notFound } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/console-page-header";
import { MemberForm } from "@/components/console/members/member-form";
import { getMemberForAdmin } from "@/lib/member/list-members";
import type { MemberStatusValue } from "@/lib/member/member-status";

type EditMemberPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { id } = await params;
  const member = await getMemberForAdmin(id);
  if (!member) notFound();

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Member"
        title={`Edit ${member.name}`}
        description="Ubah data profil dan status keamanan. Saldo/poin dikelola di menu Saldo & Poin."
        backLink={{
          href: `/console/members/${member.id}`,
          label: "← Kembali ke detail member",
        }}
      />

      <div className="console-panel console-panel--padded">
        <MemberForm
          memberId={member.id}
          initialValues={{
            memberCode: member.memberCode,
            name: member.name,
            email: member.email,
            whatsapp: member.whatsapp ?? "",
            status: member.status as MemberStatusValue,
            statusReason: member.statusReason ?? "",
          }}
        />
      </div>
    </div>
  );
}
